import {
  alternatives,
  AlternativesSchema,
  any,
  array,
  ArraySchema,
  boolean,
  BooleanSchema,
  number,
  object,
  ObjectSchema,
  ref,
  string,
  StringSchema
} from 'joi';
import { REFERENCE_CHILD_OF, REFERENCE_FOLLOWS_FROM } from 'opentracing';

/** A 16 character string representing a span ID. */
export const spanIdSchema: StringSchema = string().length(16);

/** A 16 or 32 character string representing a trace ID. */
export const traceIdSchema: AlternativesSchema = alternatives().try(spanIdSchema, string().length(32));

/** A valid JSON object. */
export const baggageSchema = object();

/** A JSON object encoding a [span context](https://opentracing.io/specification/#spancontext). */
export const contextSchema: ObjectSchema = object()
  .keys({
    trace_id: traceIdSchema.required(),
    span_id: spanIdSchema.required(),
    baggage: baggageSchema.required()
  })
  .unknown(true)
  .optionalKeys('baggage', 'trace_id');

/** A JSON object representing a [span tag](https://opentracing.io/specification/#set-a-span-tag). */
export const tagsSchema: ObjectSchema = object()
  .pattern(/.+/, alternatives().try(string(), boolean(), number()).required());

/** A JSON object representing a [span log](https://opentracing.io/specification/#log-structured-data). */
export const logSchema: ObjectSchema = object()
  .keys({
    fields: object().pattern(/.+/, any()).required(),
    timestamp: number().required()
  })
  .optionalKeys('timestamp');

/**
 * A JSON object representing a
 * [span reference](https://opentracing.io/specification/#references-between-spans).
 */
export const referenceSchema: ObjectSchema = object()
  .keys({
    type: string().valid(REFERENCE_CHILD_OF, REFERENCE_FOLLOWS_FROM).required(),
    context: contextSchema.required()
  });

/** A JSON object representing a [span](https://opentracing.io/specification/#the-opentracing-data-model). */
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

/** An array of span objects, each adhering to the [[spanSchema | span schema]]. */
export const spanArrSchema: ArraySchema = array().items(spanSchema.required()).min(1);

/**
 * A single span or an array of spans, adhering to the [[spanSchema | span schema]] or the
 * [[spanArrSchema | span array schema]] respectively.
 */
export const spanReqSchema: AlternativesSchema = alternatives().try(spanSchema, spanArrSchema).required();

/** A boolean representing whether to force record or force suppress a trace. */
export const forceSampleSchema: BooleanSchema = boolean();