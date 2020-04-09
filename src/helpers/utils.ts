import Endpoint = Foxx.Endpoint;
import Transaction = ArangoDB.Transaction;
import { AlternativesSchema, ArraySchema, BooleanSchema, ObjectSchema, StringSchema } from 'joi';
import {
    FORMAT_TEXT_MAP,
    globalTracer,
    initGlobalTracer,
    REFERENCE_CHILD_OF,
    REFERENCE_FOLLOWS_FROM,
    Span,
    SpanOptions,
    Tracer
} from 'opentracing';
import { get, isNil, reject } from 'lodash';
import { FoxxContext, FoxxSpan, FoxxTracer, SpanData } from '..';
import { db } from '@arangodb';
import { ERROR } from "opentracing/lib/ext/tags";
import { FoxxReporter } from "../reporters";
import { ContextualTracer } from "../opentracing-impl/FoxxTracer";

const joi = require('joi');
const tasks = require('@arangodb/tasks');

const tracer = globalTracer() as ContextualTracer;
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
    TRACE_ID = 'X-Trace-ID',
    PARENT_SPAN_ID = 'X-Parent-Span-ID',
    BAGGAGE = 'X-Baggage',
    FORCE_SAMPLE = 'X-Force-Sample'
}

export interface TraceHeaders {
    [TRACE_HEADER_KEYS.TRACE_ID]?: string;
    [TRACE_HEADER_KEYS.PARENT_SPAN_ID]?: string;
    [TRACE_HEADER_KEYS.BAGGAGE]?: object;
    [TRACE_HEADER_KEYS.FORCE_SAMPLE]?: boolean;
}

export function setTracerHeaders(endpoint: Endpoint): void {
    endpoint.header(TRACE_HEADER_KEYS.TRACE_ID, traceIdSchema, '64 or 128 bit trace id to use for creating spans.');
    endpoint.header(TRACE_HEADER_KEYS.PARENT_SPAN_ID, spanIdSchema, '64 bit parent span id to use for creating spans.');
    endpoint.header(TRACE_HEADER_KEYS.BAGGAGE, baggageSchema, 'Context baggage.');
    endpoint.header(TRACE_HEADER_KEYS.FORCE_SAMPLE, forceSampleSchema, 'Boolean flag to force sampling on or off. ' +
        'Leave blank to let the tracer decide.');
}

export function getTraceDirectiveFromHeaders(headers?: TraceHeaders): boolean | null {
    const { PARENT_SPAN_ID, FORCE_SAMPLE } = TRACE_HEADER_KEYS;

    return get(headers, FORCE_SAMPLE, get(headers, PARENT_SPAN_ID) ? true : null);
}

export function startSpan(name: string, options: SpanOptions = {}, implicitParent: boolean = true, forceTrace?: boolean): Span {
    let doTrace;

    let co = options.childOf;
    if (!co && implicitParent && tracer.currentContext) {
        co = options.childOf = tracer.currentContext;
    }

    if (isNil(forceTrace)) {
        if (co) {
            doTrace = co instanceof FoxxContext || co instanceof FoxxSpan;
        } else {
            const samplingProbability = module.context.configuration['sampling-probability'];

            doTrace = Math.random() < samplingProbability;
        }
    } else {
        doTrace = forceTrace;
    }

    return doTrace ? tracer.startSpan(name, options) : noopTracer.startSpan(name, options);
}

export function reportSpan(spanData: SpanData) {
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
}

interface TaskOpts {
    command: Function;
    params?: any;
}

export function instrumentEntryPoints() {
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

export function attachChildSpan(fn: Function | FunctionConstructor, operation?: string, forceTrace?: boolean) {
    operation = operation || fn.name;

    return function () {
        const options: SpanOptions = {
            tags: {
                args: reject(arguments, isNil)
            }
        };
        const cc = tracer.currentContext;
        if (cc) {
            options.childOf = cc;
        }

        this.span = startSpan(operation, options, true, forceTrace);
        let ex = null;
        try {
            if (new.target) {
                return Reflect.construct(fn, arguments, new.target);
            }

            return fn.apply(this, arguments);
        } catch (e) {
            this.span.setTag(ERROR, true);
            this.span.log({
                errorMessage: e.message
            });
            ex = e;
        } finally {
            this.span.finish();
        }

        if (ex) {
            throw ex;
        }
    }
}