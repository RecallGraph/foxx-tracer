/**
 * This module exports a number of interfaces for data types that are used internally as well as by the
 * collector and reporter plugins.
 *
 * **This module is re-exported as a top-level export.**
 *
 * @packageDocumentation
 */

import { SpanOptions } from "opentracing";

/**
 * Schema for representing a JSON-serialized
 * [tag value](https://opentracing-javascript.surge.sh/interfaces/spanoptions.html#tags).
 */
export type TagValue = number | string | boolean;


/**
 * Schema for representing a JSON-serialized
 * [tag](https://opentracing-javascript.surge.sh/interfaces/spanoptions.html#tags).
 */
export interface Tags {
  [key: string]: TagValue;
}

/**
 * Schema for representing a JSON-serialized
 * [Log](https://opentracing-javascript.surge.sh/interfaces/log.html).
 */
export interface Log {
  fields: { [key: string]: any; };
  timestamp?: number;
}

/**
 * Schema for representing a JSON-serialized
 * [SpanContext](https://opentracing-javascript.surge.sh/classes/spancontext.html).
 */
export interface Context {
  span_id: string;
  trace_id?: string;
  baggage?: object;
}

/**
 * Schema for representing a JSON-serialized
 * [Reference](https://opentracing-javascript.surge.sh/classes/reference.html).
 */
export interface Reference {
  type: string;
  context: Context;
}

/**
 * Schema for representing a JSON-serialized
 * [Span](https://opentracing-javascript.surge.sh/classes/span.html).
 */
export interface SpanData {
  operation: string;
  context: Context;
  startTimeMs: number;
  finishTimeMs: number;
  tags?: Tags;
  logs?: Log[];
  references?: Reference[];
}

/**
 * The HTTP header keys that are used to control tracing behaviour and for setting trace context.
 */
export enum TRACE_HEADER_KEYS {
  /**
   * The trace ID under which to record all new spans. If unspecified, a new trace is started and is
   * assigned a randomly generated [[generateUUID | UUID]].
   *
   * Note that if a new trace is started by *foxx-tracer*, the subsequent root span's span ID will **not**
   * be same as the generated trace ID.
   */
  TRACE_ID = 'x-trace-id',

  /**
   * A span ID (belonging to an ongoing trace) under which to create the top level span of the traced request.
   * This header **must be accompanied** by a non-emtpy [[TRACE_HEADER_KEYS.TRACE_ID | TRACE_ID]] header.
   * All spans generated with the application will now have this span ID as an ancestor.
   */
  PARENT_SPAN_ID = 'x-parent-span-id',

  /**
   * A JSON object containing key-value pairs that will set as the
   * [baggage](https://opentracing.io/specification/#set-a-baggage-item) for all spans recorded for this
   * request.
   */
  BAGGAGE = 'x-baggage',

  /**
   * An optional boolean that control whether the decision to record a trace should be forced,
   * suppressed or be left to the application to decide. If `true` a sample is forced. If `false` no sample
   * is taken. If left blank, the application decides based on the `sampling-probability` configuration
   * parameter (TODO: Add link to param docs).
   */
  FORCE_SAMPLE = 'x-force-sample'
}

/**
 * @internal
 */
export interface TraceHeaders {
  [TRACE_HEADER_KEYS.TRACE_ID]?: string;
  [TRACE_HEADER_KEYS.PARENT_SPAN_ID]?: string;
  [TRACE_HEADER_KEYS.BAGGAGE]?: object;
  [TRACE_HEADER_KEYS.FORCE_SAMPLE]?: boolean;
}

/**
 * @ignore
 */
export interface TaskOpts {
  command: Function;
  params?: any;
}

/**
 * @internal
 */
export interface InstrumentedOpts {
  _traceId: string;
  _parentContext: object;
  _params: object;
  _operation: string;
  _options?: SpanOptions;
}

/**
 * @internal
 */
export interface TxnParams extends InstrumentedOpts {
  _action: (params: object | undefined) => any;
}

/**
 * @internal
 */
export interface TaskParams extends InstrumentedOpts {
  _command: (params: object | undefined) => void;
}