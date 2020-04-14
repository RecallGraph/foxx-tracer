import Endpoint = Foxx.Endpoint;
import Transaction = ArangoDB.Transaction;
import Query = ArangoDB.Query;
import { AlternativesSchema, ArraySchema, BooleanSchema, ObjectSchema, StringSchema } from 'joi';
import {
  FORMAT_HTTP_HEADERS,
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
import { cloneDeep, defaultsDeep, get, isString, mapKeys, omit } from 'lodash';
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

export function setTrace(headers: TraceHeaders): void {
  const { FORCE_SAMPLE } = TRACE_HEADER_KEYS;
  const forceSample = headers[FORCE_SAMPLE];

  if (forceSample === false) {
    return;
  } else if (forceSample === true) {
    setTraceContextFromHeaders(headers);
  } else {
    const samplingProbability = module.context.configuration['sampling-probability'];
    const doTrace = Math.random() < samplingProbability;

    if (doTrace) {
      setTraceContextFromHeaders(headers);
    }
  }
}

function setTraceContextFromHeaders(headers: TraceHeaders) {
  const tracer = globalTracer() as ContextualTracer;
  const { TRACE_ID } = TRACE_HEADER_KEYS;

  const traceId = headers[TRACE_ID] || FoxxSpan.generateUUID();
  headers[TRACE_ID] = traceId;

  const rootContext = tracer.extract(FORMAT_HTTP_HEADERS, headers);
  setTraceContext(traceId, rootContext);
}

export function getParent(refs: Reference[]): SpanContext {
  const parent = refs ? refs.find(ref => ref.type() === REFERENCE_CHILD_OF) : null;

  return parent ? parent.referencedContext() : null;
}

export function setTraceContext(traceID?: string, context?: SpanContext) {
  const tracer = globalTracer() as ContextualTracer;

  tracer.currentContext = context;
  tracer.currentTrace = traceID;
}

export function clearTraceContext() {
  const tracer = globalTracer() as ContextualTracer;

  tracer.currentContext = null;
  tracer.currentTrace = null;
}

export function startSpan(name: string, options: SpanOptions = {}): Span {
  const tracer = globalTracer() as ContextualTracer;

  if (tracer.currentTrace) {
    const co = options.childOf || getParent(options.references);

    if (!co && tracer.currentContext) {
      options.childOf = tracer.currentContext;
    }

    return tracer.startSpan(name, options);
  }

  return noopTracer.startSpan(name, options);
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

  Object.defineProperty(gTracer, 'currentTrace', {
    get() {
      return tracer.currentTrace;
    },

    set(traceId: string): void {
      tracer.currentTrace = traceId;
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

interface InstrumentedOpts {
  _traceId: string;
  _parentContext: object;
  _params: object;
}

interface TxnParams extends InstrumentedOpts {
  _action: (params: object | undefined) => any;
}

interface TaskParams extends InstrumentedOpts {
  _command: (params: object | undefined) => void;
}

export function executeTransaction(data: Transaction) {
  const tracer = globalTracer() as ContextualTracer;

  let spanContext = null;
  if (tracer.currentContext) {
    spanContext = {};
    tracer.inject(tracer.currentContext, FORMAT_TEXT_MAP, spanContext);
  }

  const spanColl = module.context.dependencies.traceCollector.spanColl;
  if (Array.isArray(data.collections)) {
    data.collections.push(spanColl);
  } else if (isString(data.collections.write)) {
    data.collections.write = [data.collections.write, spanColl];
  } else if (Array.isArray(data.collections.write)) {
    data.collections.write.push(spanColl);
  } else {
    data.collections.write = spanColl;
  }

  const wrappedData = omit(data, 'action', 'params') as Transaction;
  wrappedData.params = {
    _traceId: tracer.currentTrace,
    _parentContext: spanContext,
    _params: data.params,
    _action: data.action
  };
  wrappedData.action = function (params: TxnParams) {
    const { globalTracer } = require('opentracing');

    const tracer = globalTracer() as ContextualTracer;
    const rootContext = tracer.extract(FORMAT_TEXT_MAP, params._parentContext);

    setTraceContext(params._traceId, rootContext);
    const result = params._action(params._params);
    clearTraceContext();

    return result;
  }

  return db._executeTransaction(wrappedData);
}

export function executeTask(options: TaskOpts) {
  const tracer = globalTracer() as ContextualTracer;

  let spanContext = null;
  if (tracer.currentContext) {
    spanContext = {};
    tracer.inject(tracer.currentContext, FORMAT_TEXT_MAP, spanContext);
  }

  const wrappedOptions = omit(options, 'command', 'params') as TaskOpts;
  wrappedOptions.params = {
    _traceId: tracer.currentTrace,
    _parentContext: spanContext,
    _params: options.params,
    _command: options.command
  };
  wrappedOptions.command = function (params: TaskParams) {
    const { globalTracer } = require('opentracing');

    const tracer = globalTracer() as ContextualTracer;
    const rootContext = tracer.extract(FORMAT_TEXT_MAP, params._parentContext);

    setTraceContext(params._traceId, rootContext);
    params._command(params._params);
    clearTraceContext();
  }

  tasks.register(wrappedOptions);
}

export function attachSpan(
  fn: Function | FunctionConstructor, operation: string, options: SpanOptions = {},
  onSuccess?: (result: any, span: Span) => void, onError?: (err: Error, span: Span) => void
) {
  return function () {
    const optsCopy = cloneDeep(options);
    const span = startSpan(operation, optsCopy);

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

export function instrumentedQuery(query: Query, operation: string, options: SpanOptions = {}) {
  const optsCopy = cloneDeep(options)
  defaultsDeep(optsCopy, {
    tags: {
      query: query.query,
      bindVars: query.bindVars,
      options: query.options
    }
  })

  const span = startSpan(operation, optsCopy);
  const cursor = db._query(query)

  span.log(cursor.getExtra())
  span.finish()

  const results = cursor.toArray()
  cursor.dispose()

  return results;
}