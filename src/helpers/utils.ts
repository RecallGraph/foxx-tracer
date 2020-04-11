import Endpoint = Foxx.Endpoint;
import Transaction = ArangoDB.Transaction;
import { AlternativesSchema, ArraySchema, BooleanSchema, ObjectSchema, StringSchema } from 'joi';
import {
    FORMAT_TEXT_MAP,
    globalTracer,
    initGlobalTracer,
    Reference,
    REFERENCE_CHILD_OF,
    REFERENCE_FOLLOWS_FROM,
    Span,
    SpanOptions,
    Tracer
} from 'opentracing';
import { defaultsDeep, get, isNil, mapKeys, omitBy } from 'lodash';
import { FoxxContext, FoxxSpan, FoxxTracer, SpanData } from '..';
import { db } from '@arangodb';
import { ERROR } from "opentracing/lib/ext/tags";
import { FoxxReporter } from "../reporters";
import { ContextualTracer } from "../opentracing-impl/FoxxTracer";
import SpanContext from "opentracing/lib/span_context";

const joi = require('joi');
const tasks = require('@arangodb/tasks');

const noopTracer = new Tracer();

export const spanIdSchema: StringSchema = joi
    .string()
    .length(16);

export const traceIdSchema: AlternativesSchema = joi
    .alternatives()
    .try(spanIdSchema, joi
        .string()
        .length(32)
    );

export const baggageSchema = joi.object();

export const contextSchema: ObjectSchema = joi
    .object()
    .keys({
        trace_id: traceIdSchema.required(),
        span_id: spanIdSchema.required(),
        baggage: baggageSchema.required()
    })
    .unknown(true)
    .optionalKeys('baggage', 'trace_id');

export const tagsSchema: ObjectSchema = joi
    .object()
    .pattern(/.+/, joi
        .alternatives()
        .try(joi.string(), joi.boolean(), joi.number())
        .required()
    );

export const logSchema: ObjectSchema = joi
    .object()
    .keys({
        fields: joi
            .object()
            .pattern(/.+/, joi.any())
            .required(),
        timestamp: joi
            .number()
            .required()
    })
    .optionalKeys('timestamp');

export const referenceSchema: ObjectSchema = joi
    .object()
    .keys({
        type: joi
            .string()
            .valid(REFERENCE_CHILD_OF, REFERENCE_FOLLOWS_FROM)
            .required(),
        context: contextSchema.required()
    });
export const spanSchema: ObjectSchema = joi
    .object()
    .keys({
        operation: joi
            .string()
            .required(),
        context: contextSchema.required(),
        startTimeMs: joi
            .number()
            .required(),
        finishTimeMs: joi
            .number()
            .required()
            .min(joi.ref('startTimeMs')),
        tags: tagsSchema.required(),
        logs: joi
            .array()
            .items(logSchema.required())
            .required(),
        references: joi
            .array()
            .items(referenceSchema.required())
            .required()
    })
    .optionalKeys('tags', 'logs', 'references');

export const spanArrSchema: ArraySchema = joi
    .array()
    .items(spanSchema.required())
    .min(1);

export const spanReqSchema: AlternativesSchema = joi
    .alternatives()
    .try(spanSchema, spanArrSchema)
    .required();

export const forceSampleSchema: BooleanSchema = joi.boolean();

export enum TRACE_HEADER_KEYS {
    TRACE_ID = 'x-trace-id',
    PARENT_SPAN_ID = 'x-parent-span-id',
    BAGGAGE = 'x-baggage',
    FORCE_SAMPLE = 'x-force-sample'
}

export interface TraceHeaders {
    [TRACE_HEADER_KEYS.TRACE_ID]?: string;
    [TRACE_HEADER_KEYS.PARENT_SPAN_ID]?: string;
    [TRACE_HEADER_KEYS.BAGGAGE]?: object;
    [TRACE_HEADER_KEYS.FORCE_SAMPLE]?: boolean;
}

const TRACE_HEADER_SCHEMAS = Object.freeze({
    [TRACE_HEADER_KEYS.TRACE_ID]: {
        schema: traceIdSchema,
        description: '64 or 128 bit trace id to use for creating spans.'
    },
    [TRACE_HEADER_KEYS.PARENT_SPAN_ID]: {
        schema: spanIdSchema,
        description: '64 bit parent span id to use for creating spans.'
    },
    [TRACE_HEADER_KEYS.BAGGAGE]: {
        schema: baggageSchema,
        description: 'Context baggage.'
    },
    [TRACE_HEADER_KEYS.FORCE_SAMPLE]: {
        schema: forceSampleSchema,
        description: 'Boolean flag to force sampling on or off. Leave blank to let the tracer decide.'
    }
});

export function setEndpointTraceHeaders(endpoint: Endpoint): void {
    for (const [key, value] of Object.entries(TRACE_HEADER_SCHEMAS)) {
        endpoint.header(key, value.schema, value.description);
    }
}

export function parseTraceHeaders(headers: { [key: string]: string | undefined }): TraceHeaders {
    headers = mapKeys(headers, (v, k) => k.toLowerCase());

    const traceHeaders: TraceHeaders = {};
    for (const [key, value] of Object.entries(TRACE_HEADER_SCHEMAS)) {
        const headerVal = get(headers, key);
        if (headerVal) {
            traceHeaders[key] = joi.validate(headerVal, value.schema).value;
        }
    }

    const { PARENT_SPAN_ID, TRACE_ID } = TRACE_HEADER_KEYS;
    if (traceHeaders[PARENT_SPAN_ID] && !traceHeaders[TRACE_ID]) {
        throw new Error('Parent span received without associated trace ID.');
    }

    return traceHeaders;
}

export function getTraceDirectiveFromHeaders(headers: TraceHeaders): boolean | null {
    const { FORCE_SAMPLE, PARENT_SPAN_ID, TRACE_ID } = TRACE_HEADER_KEYS;
    let doTrace = [FORCE_SAMPLE, PARENT_SPAN_ID, TRACE_ID].find(key => !isNil(headers[key]));

    return isNil(doTrace) ? null : !!doTrace;
}

export function getParent(refs: Reference[]): SpanContext {
    const parent = refs.find(ref => ref.type() === REFERENCE_CHILD_OF);

    return parent ? parent.referencedContext() : null;
}

export function setTraceContext(traceID?: string, context?: SpanContext) {
    if (!traceID) {
        traceID = context.toTraceId();
    }

    const tracer = globalTracer() as ContextualTracer;
    tracer.currentContext = context;
    tracer.currentTrace = traceID;
}

export function startSpan(name: string, implicitParent: boolean = true, options: SpanOptions = {}, doTrace?: boolean): Span {
    const tracer = globalTracer() as ContextualTracer;

    if (!module.context.dependencies.traceCollector) {
        doTrace = false;
    } else {
        let co = options.childOf || getParent(options.references);
        if (!co && implicitParent && tracer.currentContext && tracer.currentContext.toSpanId()) {
            co = options.childOf = tracer.currentContext;
        }

        if (isNil(doTrace)) {
            if (co) {
                doTrace = co instanceof FoxxContext || co instanceof FoxxSpan;
            } else if (tracer.currentTrace) {
                doTrace = true;
            } else {
                const samplingProbability = module.context.configuration['sampling-probability'];

                doTrace = Math.random() < samplingProbability;
            }
        }
    }

    let span;
    if (doTrace) {
        span = tracer.startSpan(name, options);
    } else {
        span = noopTracer.startSpan(name, options);
        tracer.currentContext = span;
    }

    return span;
}

export function reportSpan(spanData: SpanData) {
    const tracer = globalTracer() as ContextualTracer;

    tracer.reporter.report([[spanData]]);
}

export function initTracer() {
    const reporter = new FoxxReporter();
    const tracer = new FoxxTracer(reporter);
    initGlobalTracer(tracer);

    const gTracer = globalTracer();
    Object.defineProperty(gTracer, 'currentContext', {
        get() {
            return tracer.currentContext;
        },

        set(context: FoxxContext): void {
            tracer.currentContext = context;
        },
        enumerable: true,
        configurable: false
    });

    Object.defineProperty(gTracer, 'reporter', {
        value: tracer.reporter,
        writable: false,
        enumerable: true,
        configurable: false
    });
}

interface TaskOpts {
    command: Function;
    params?: any;
}

export function instrumentEntryPoints() {
    const tracer = globalTracer() as ContextualTracer;
    const et = db._executeTransaction;

    db._executeTransaction = function (data: Transaction) {
        const spanContext = tracer.inject(tracer.currentContext, FORMAT_TEXT_MAP, {});
        data.params = {
            _parentContext: spanContext,
            _params: data.params,
            _action: data.action
        };

        data.action = function (params) {
            const { get } = require('lodash');

            const tracer = globalTracer() as ContextualTracer;
            tracer.currentContext = tracer.extract(FORMAT_TEXT_MAP, get(params, '_parentContext')) as FoxxContext;

            return get(params, '_action').call(this, get(params, '_params'));
        };

        return et.call(db, data);
    };

    const rt = tasks.register;
    tasks.register = function (options: TaskOpts) {
        const spanContext = tracer.inject(tracer.currentContext, FORMAT_TEXT_MAP, {});
        options.params = {
            _parentContext: spanContext,
            _params: options.params,
            _cmd: options.command
        };

        options.command = function (params) {
            const { get } = require('lodash');

            const tracer = globalTracer() as ContextualTracer;
            tracer.currentContext = tracer.extract(FORMAT_TEXT_MAP, get(params, '_parentContext')) as FoxxContext;

            params._cmd(params._params);
        };

        rt.call(tasks, options);
    }
}

export function attachSpan(fn: Function | FunctionConstructor, operation: string, implicitParent: boolean = true,
                           options: SpanOptions = {}, forceTrace: boolean,
                           onSuccess?: (result: any, span: Span) => void,
                           onError?: (err: Error, span: Span) => void) {
    return function () {
        defaultsDeep(options, { tags: {} });
        options.tags.args = omitBy(arguments, isNil);
        const span = startSpan(operation, implicitParent, options, forceTrace);
        try {
            let result;
            if (new.target) {
                result = Reflect.construct(fn, arguments, new.target);
            } else {
                result = fn.apply(this, arguments);
            }

            if (onSuccess) {
                onSuccess(result, span);
            } else {
                span.finish();

                return result;
            }
        } catch (e) {
            span.setTag(ERROR, true);
            span.log({
                errorMessage: e.message
            });

            if (onError) {
                onError(e, span);
            } else {
                span.finish();

                throw e;
            }
        }
    }
}