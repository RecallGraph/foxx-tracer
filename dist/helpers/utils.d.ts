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
/// <reference types="arangodb" />
import Transaction = ArangoDB.Transaction;
import Query = ArangoDB.Query;
import Endpoint = Foxx.Endpoint;
import { Span, SpanContext, SpanOptions } from 'opentracing';
import SpanData from './SpanData';
/**
 * @ignore
 */
export interface TraceHeaders {
    [TRACE_HEADER_KEYS.TRACE_ID]?: string;
    [TRACE_HEADER_KEYS.PARENT_SPAN_ID]?: string;
    [TRACE_HEADER_KEYS.BAGGAGE]?: object;
    [TRACE_HEADER_KEYS.FORCE_SAMPLE]?: boolean;
}
export interface TaskOpts {
    command: Function;
    params?: any;
}
/**
 * @ignore
 */
export declare function setEndpointTraceHeaders(endpoint: Endpoint): void;
/**
 * @ignore
 */
export declare function parseTraceHeaders(headers: {
    [key: string]: string | undefined;
}): TraceHeaders;
/**
 * @ignore
 */
export declare function setTrace(headers: TraceHeaders): void;
/**
 * @ignore
 */
export declare function setTraceContext(traceID?: string, context?: SpanContext): void;
/**
 * Clears the global tracer's memory of all trace and span context. Useful when it is desired to manually
 * start a fresh trace. Normally required only in test suite runs.
 */
export declare function clearTraceContext(): void;
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
export declare function startSpan(name: string, options?: SpanOptions): Span;
/**
 * @ignore
 */
export declare function reportSpan(spanData: SpanData): void;
/**
 * Initializes the global tracer at application startup. This should be called as early as possible (and only
 * once) when application starts.
 */
export declare function initTracer(): void;
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
export declare function executeTransaction(data: Transaction, operation: string, options?: SpanOptions): void;
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
export declare function executeTask(task: TaskOpts, operation: string, options?: SpanOptions): void;
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
export declare function attachSpan(fn: Function | FunctionConstructor, operation: string, options?: SpanOptions, onSuccess?: (result: any, span: Span) => void, onError?: (err: Error, span: Span) => void): () => any;
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
export declare function instrumentedQuery(query: Query, operation: string, options?: SpanOptions): ArangoDB.Cursor<any>;
//# sourceMappingURL=utils.d.ts.map