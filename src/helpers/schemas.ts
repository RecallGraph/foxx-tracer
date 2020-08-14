/**
 * This module exports a number of validation schemas that are used internally as well as by the collector
 * to validate incoming [[SpanData]].
 *
 * **This module is re-exported as a top-level export.**
 *
 * @packageDocumentation
 */

import dd = require('dedent');
import {
  alternatives,
  AlternativesSchema,
  any,
  array,
  ArraySchema,
  boolean,
  number,
  object,
  ObjectSchema,
  ref,
  string,
  StringSchema
} from 'joi';
import { REFERENCE_CHILD_OF, REFERENCE_FOLLOWS_FROM } from 'opentracing';
import { TRACE_HEADER_KEYS } from "./types";

/** A validation schema for a 16 character string representing a span ID. */
export const spanIdSchema: StringSchema = string().length(16);

/** A validation schema for a 16 or 32 character string representing a trace ID. */
export const traceIdSchema: AlternativesSchema = alternatives().try(spanIdSchema, string().length(32));

/** A validation schema for a JSON object representing a [[Context | span context]]. */
export const contextSchema: ObjectSchema = object()
  .keys({
    trace_id: traceIdSchema.required(),
    span_id: spanIdSchema.required(),
    baggage: object().required()
  })
  .unknown(true)
  .optionalKeys('baggage', 'trace_id');

/** A validation schema for a JSON object representing a [[Tag | span tag]]. */
export const tagsSchema: ObjectSchema = object()
  .pattern(/.+/, alternatives().try(string(), boolean(), number()).required());

/** A validation schema for a JSON object representing a [[Log | span log]]. */
export const logSchema: ObjectSchema = object()
  .keys({
    fields: object().pattern(/.+/, any()).required(),
    timestamp: number().required()
  })
  .optionalKeys('timestamp');

/**
 * A validation schema for a JSON object representing a [[Reference | span reference]].
 */
export const referenceSchema: ObjectSchema = object()
  .keys({
    type: string().valid(REFERENCE_CHILD_OF, REFERENCE_FOLLOWS_FROM).required(),
    context: contextSchema.required()
  });

/** A validation schema for a JSON object adhering to the [[SpanData]] interface. */
export const spanSchema: ObjectSchema = object()
  .keys({
    operation: string().required(),
    context: contextSchema.required(),
    startTimeMs: number().required(),
    finishTimeMs: number().required().min(ref('startTimeMs')),
    tags: tagsSchema.required(),
    logs: array().items(logSchema).min(0).required(),
    references: array().items(referenceSchema).min(0).required()
  })
  .optionalKeys('tags', 'logs', 'references');

/** A validation schema for an array of span objects, each adhering to the [[spanSchema | span schema]]. */
export const spanArrSchema: ArraySchema = array().items(spanSchema.required()).min(1);

/**
 * A validation schema for a single span or an array of spans, adhering to the [[spanSchema | span schema]]
 * or the [[spanArrSchema | span array schema]] respectively.
 */
export const spanReqSchema: AlternativesSchema = alternatives().try(spanSchema, spanArrSchema).required();

/**
 * @internal
 */
export const TRACE_HEADER_SCHEMAS = Object.freeze({
  [TRACE_HEADER_KEYS.TRACE_ID]: {
    schema: traceIdSchema,
    description: '64 or 128 bit trace id to use for creating spans.'
  },
  [TRACE_HEADER_KEYS.PARENT_SPAN_ID]: {
    schema: spanIdSchema,
    description: dd`
      64 bit parent span id to use for creating spans.
      Must be accompanied by a ${TRACE_HEADER_KEYS.TRACE_ID}.
    `
  },
  [TRACE_HEADER_KEYS.BAGGAGE]: {
    schema: object(),
    description: 'Context baggage. Must be a valid JSON object.'
  },
  [TRACE_HEADER_KEYS.FORCE_SAMPLE]: {
    schema: boolean(),
    description: 'Boolean flag to force sampling on or off. Leave blank to let the tracer decide.'
  }
});