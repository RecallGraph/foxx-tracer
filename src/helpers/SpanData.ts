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
export default interface SpanData {
  operation: string;
  context: Context;
  startTimeMs: number;
  finishTimeMs: number;
  tags?: Tags;
  logs?: Log[];
  references?: Reference[];
}