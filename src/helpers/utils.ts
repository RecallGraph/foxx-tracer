/**
 * This module exports a number of utility functions that are used throughout the application
 * being traced. Some functions are specifically meant to be called at application startup to initialize the
 * global tracer, set up trace headers, etc.
 *
 * **This module is re-exported as a top-level export.**
 *
 * See the [quickstart](../index.html#quickstart) for a primer on how
 * to set up your application for tracing.
 *
 * @packageDocumentation
 */

import Transaction = ArangoDB.Transaction;
import Query = ArangoDB.Query;
import Endpoint = Foxx.Endpoint;
import {
  FORMAT_HTTP_HEADERS,
  FORMAT_TEXT_MAP,
  globalTracer,
  initGlobalTracer,
  Reference,
  REFERENCE_CHILD_OF,
  Span,
  SpanContext,
  SpanOptions,
  Tags,
  Tracer
} from 'opentracing';
import { defaultsDeep, get, mapKeys, omit, pickBy } from 'lodash';
import { FoxxContext, FoxxTracer } from '../opentracing-impl';
import { SpanData, TaskOpts, TaskParams, TRACE_HEADER_KEYS, TraceHeaders, TxnParams } from './types';
import { db } from '@arangodb';
import FoxxReporter from '../reporters/FoxxReporter';
import { ContextualTracer } from '../opentracing-impl/FoxxTracer';
import { TRACE_HEADER_SCHEMAS } from './schemas';
import { validate } from 'joi';

const tasks = require('@arangodb/tasks');

const noopTracer = new Tracer();
const { manifest: { name, version }, baseUrl } = module.context;
const service = `${name}-${version} (${baseUrl})`;

function setTraceContextFromHeaders(headers: TraceHeaders) {
  const tracer = globalTracer() as ContextualTracer;
  const { TRACE_ID } = TRACE_HEADER_KEYS;

  const traceId = headers[TRACE_ID] || generateUUID();
  headers[TRACE_ID] = traceId;

  const rootContext = tracer.extract(FORMAT_HTTP_HEADERS, headers);
  setTraceContext(traceId, rootContext);
}

/**
 * @internal
 */
export function setEndpointTraceHeaders(endpoint: Endpoint): void {
  for (const [key, value] of Object.entries(TRACE_HEADER_SCHEMAS)) {
    endpoint.header(key, value.schema, value.description);
  }
}

/**
 * @internal
 */
export function parseTraceHeaders(headers: { [key: string]: string | undefined }): TraceHeaders {
  headers = mapKeys(headers, (v, k) => k.toLowerCase());

  const traceHeaders: TraceHeaders = {};
  for (const [key, value] of Object.entries(TRACE_HEADER_SCHEMAS)) {
    const headerVal = get(headers, key);
    if (headerVal) {
      traceHeaders[key] = validate(headerVal, value.schema).value;
    }
  }

  const { PARENT_SPAN_ID, TRACE_ID } = TRACE_HEADER_KEYS;
  if (traceHeaders[PARENT_SPAN_ID] && !traceHeaders[TRACE_ID]) {
    throw new Error('Parent span received without associated trace ID.');
  }

  return traceHeaders;
}

/**
 * @internal
 */
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

/**
 * Returns a parent context (if found) from the input array of references.
 *
 * @param refs The [Reference](https://opentracing-javascript.surge.sh/classes/reference.html) array.
 *
 * @return The [SpanContext](https://opentracing-javascript.surge.sh/classes/spancontext.html) of the
 * reference representing the parent, if found, `null` otherwise.
 *
 * @internal
 */
export function getParent(refs: Reference[]): SpanContext {
  const parent = refs ? refs.find(ref => ref.type() === REFERENCE_CHILD_OF) : null;

  return parent ? parent.referencedContext() : null;
}

/**
 * @internal
 */
export function setTraceContext(traceID?: string, context?: SpanContext) {
  const tracer = globalTracer() as ContextualTracer;

  tracer.currentContext = context;
  tracer.currentTrace = traceID;
}

/**
 * Clears the global tracer's memory of all trace and span context. Useful when it is desired to manually
 * start a fresh trace. Normally required only in test suite runs.
 */
export function clearTraceContext() {
  const tracer = globalTracer() as ContextualTracer;
  const traceId = tracer.currentTrace;

  tracer.currentContext = null;
  tracer.currentTrace = null;

  if (traceId) {
    tracer.flush(traceId);
  }
}

/**
 * Start a new span. Useful when it is desired to manually start a fresh trace. Normally required only in
 * test suite runs.
 *
 * @param name The operation name to be recorded in the span.
 * @param options The
 * optional [SpanOptions](https://opentracing-javascript.surge.sh/interfaces/spanoptions.html) object that
 * describes the span.
 *
 * @return The created [Span](https://opentracing-javascript.surge.sh/classes/span.html).
 */
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

/**
 * @internal
 */
export function reportSpan(spanData: SpanData) {
  const tracer = globalTracer() as ContextualTracer;

  tracer.push(spanData);
}

/**
 * Initializes the global tracer at application startup. This should be called as early as possible (and only
 * once) when application starts.
 */
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

  Object.defineProperty(gTracer, 'push', {
    value: tracer.push.bind(tracer),
    writable: false,
    enumerable: true,
    configurable: false
  });

  Object.defineProperty(gTracer, 'flush', {
    value: tracer.flush.bind(tracer),
    writable: false,
    enumerable: true,
    configurable: false
  });
}

/**
 * Start a [transaction](https://www.arangodb.com/docs/3.6/transactions-transaction-invocation.html) while
 * ensuring that the trace context is correctly propagated over to the V8 context where the transaction is
 * actually run. The command executed by the transaction is wrapped in a new span which carries the same
 * trace context that was active in the V8 context that invoked the transaction.
 *
 * @param data The
 * [Transaction](https://github.com/DefinitelyTyped/DefinitelyTyped/blob/bbc8c7c7b7e92ba094ea349d56977e00f6f7f42d/types/arangodb/index.d.ts#L910)
 * description.
 * @param operation The operation name to be recorded in the span.
 * @param options The
 * optional [SpanOptions](https://opentracing-javascript.surge.sh/interfaces/spanoptions.html) object that
 * describes the span.
 */
export function executeTransaction(data: Transaction, operation: string, options: SpanOptions = {}) {
  const tracer = globalTracer() as ContextualTracer;

  let spanContext = null;
  if (tracer.currentContext) {
    spanContext = {};
    tracer.inject(tracer.currentContext, FORMAT_TEXT_MAP, spanContext);
  }

  const wrappedData = omit(data, 'action', 'params') as Transaction;
  wrappedData.params = {
    _traceId: tracer.currentTrace,
    _parentContext: spanContext,
    _params: data.params,
    _action: data.action,
    _operation: operation,
    _options: options
  };
  wrappedData.action = function (params: TxnParams) {
    const { globalTracer } = require('opentracing');
    const tracer = globalTracer() as ContextualTracer;

    const { _parentContext, _action, _operation, _options, _params, _traceId } = params;
    const rootContext = tracer.extract(FORMAT_TEXT_MAP, _parentContext);

    setTraceContext(_traceId, rootContext);
    const result = attachSpan(_action, _operation, _options).call(params, _params);
    clearTraceContext();

    return result;
  }

  return db._executeTransaction(wrappedData);
}

/**
 * Registers a [task](https://www.arangodb.com/docs/3.6/appendix-java-script-modules-tasks.html) while
 * ensuring that the trace context is correctly propagated over to the V8 context where the task is actually
 * run. The function executed by the task is wrapped in a new span which carries the same trace context that
 * was active at the time of registering the task.
 *
 * @param task The object describing the task.
 * @param operation The operation name to be recorded in the span.
 * @param options The
 * optional [SpanOptions](https://opentracing-javascript.surge.sh/interfaces/spanoptions.html) object that
 * describes the span.
 */
export function executeTask(task: TaskOpts, operation: string, options: SpanOptions = {}) {
  const tracer = globalTracer() as ContextualTracer;

  let spanContext = null;
  if (tracer.currentContext) {
    spanContext = {};
    tracer.inject(tracer.currentContext, FORMAT_TEXT_MAP, spanContext);
  }

  const wrappedOptions = omit(task, 'command', 'params') as TaskOpts;
  wrappedOptions.params = {
    _traceId: tracer.currentTrace,
    _parentContext: spanContext,
    _params: task.params,
    _command: task.command,
    _operation: operation,
    _options: options
  };
  wrappedOptions.command = function (params: TaskParams) {
    const { globalTracer } = require('opentracing');
    const tracer = globalTracer() as ContextualTracer;

    const { _parentContext, _command, _operation, _options, _params, _traceId } = params;
    const rootContext = tracer.extract(FORMAT_TEXT_MAP, _parentContext);

    setTraceContext(_traceId, rootContext);
    attachSpan(_command, _operation, _options).call(params, _params);
    clearTraceContext();
  }

  tasks.register(wrappedOptions);
}

/**
 * Creates a wrapper around the input function that, when invoked, executes the given function inside a new
 * span. When you don't need to manually alter the span before it is closed and reported, the success
 * and error callbacks can be omitted. In this case, when the function ends, it either returns its result
 * (or void) back to the caller or throws an error. In both cases, the span enclosing the function's
 * execution is always properly closed and reported, enriched with additional error information, if
 * applicable.
 *
 * On the other hand, when you need access to the span (at the end of the function) just before it is
 * finalized, you can specify the success and error callbacks, within which you will have access to the span.
 * You can now add your custom tags/logs to the span. **The span must be explicity closed in the body of both
 * callbacks** by invoking its [finish](https://opentracing-javascript.surge.sh/classes/span.html#finish)
 * method.
 *
 * @param fn The function to be wrapped in a span.
 * @param operation The operation name to be recorded in the span.
 * @param options The
 * optional [SpanOptions](https://opentracing-javascript.surge.sh/interfaces/spanoptions.html) object that
 * describes the span.
 * @param onSuccess The optional success callback. It is called with two parameters:
 * 1. `result` - containing the result of invoking `fn`.
 * 1. `span` - the [Span](https://opentracing-javascript.surge.sh/classes/span.html) object that was used to
 * instrument `fn`.
 * @param onError The optional error callback. It is called with two parameters:
 * 1. `err` - the
 * [Error](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error)
 * that occurred when invoking `fn`.
 * 1. `span` - the [Span](https://opentracing-javascript.surge.sh/classes/span.html) object that was used to
 * instrument `fn`.
 *
 * @return The wrapper function that accepts the same arguments as *fn*.
 */
export function attachSpan(
  fn: Function | FunctionConstructor, operation: string, options: SpanOptions = {},
  onSuccess?: (result: any, span: Span) => void, onError?: (err: Error, span: Span) => void
) {
  return function () {
    const optsCopy = defaultsDeep({}, options, { tags: { service } });
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
      span.setTag(Tags.ERROR, true);
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

/**
 * Executes the given query inside a new span and returns the resultant cursor. The enclosing span records
 * query stats (available within the cursor object) in its logs.
 *
 * @param query The AQL
 * [Query](https://github.com/DefinitelyTyped/DefinitelyTyped/blob/bbc8c7c7b7e92ba094ea349d56977e00f6f7f42d/types/arangodb/index.d.ts#L771)
 * to execute.
 * @param operation The operation name to be recorded in the span.
 * @param options The
 * optional [SpanOptions](https://opentracing-javascript.surge.sh/interfaces/spanoptions.html) object that
 * describes the span.
 *
 * @return The
 * [Cursor](https://github.com/DefinitelyTyped/DefinitelyTyped/blob/bbc8c7c7b7e92ba094ea349d56977e00f6f7f42d/types/arangodb/index.d.ts#L781)
 * that is created as a result of running the query.
 */
export function instrumentedQuery(query: Query, operation: string, options: SpanOptions = {}) {
  const optsCopy = defaultsDeep({}, options, { tags: { service } });
  defaultsDeep(optsCopy, {
    tags: pickBy({
      query: query.query,
      bindVars: JSON.stringify(query.bindVars),
      options: JSON.stringify(query.options)
    })
  })

  const span = startSpan(operation, optsCopy);
  const cursor = db._query(query)

  span.log(cursor.getExtra())
  span.finish()

  return cursor;
}

/**
 * Generates a 64-bit UUID string.
 *
 * @return The generated UUID string.
 */
export function generateUUID(): string {
  const p0 = `00000000${Math.abs((Math.random() * 0xFFFFFFFF) | 0).toString(16)}`.substr(-8);
  const p1 = `00000000${Math.abs((Math.random() * 0xFFFFFFFF) | 0).toString(16)}`.substr(-8);

  return `${p0}${p1}`;
}