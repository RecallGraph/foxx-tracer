import { AlternativesSchema, ArraySchema, BooleanSchema, ObjectSchema, StringSchema } from 'joi';
/** A 16 character string representing a span ID. */
export declare const spanIdSchema: StringSchema;
/** A 16 or 32 character string representing a trace ID. */
export declare const traceIdSchema: AlternativesSchema;
/** A valid JSON object. */
export declare const baggageSchema: ObjectSchema;
/** A JSON object encoding a [span context](https://opentracing.io/specification/#spancontext). */
export declare const contextSchema: ObjectSchema;
/** A JSON object representing a [span tag](https://opentracing.io/specification/#set-a-span-tag). */
export declare const tagsSchema: ObjectSchema;
/** A JSON object representing a [span log](https://opentracing.io/specification/#log-structured-data). */
export declare const logSchema: ObjectSchema;
/**
 * A JSON object representing a
 * [span reference](https://opentracing.io/specification/#references-between-spans).
 */
export declare const referenceSchema: ObjectSchema;
/** A JSON object representing a [span](https://opentracing.io/specification/#the-opentracing-data-model). */
export declare const spanSchema: ObjectSchema;
/** An array of span objects, each adhering to the [[spanSchema | span schema]]. */
export declare const spanArrSchema: ArraySchema;
/**
 * A single span or an array of spans, adhering to the [[spanSchema | span schema]] or the
 * [[spanArrSchema | span array schema]] respectively.
 */
export declare const spanReqSchema: AlternativesSchema;
/** A boolean representing whether to force record or force suppress a trace. */
export declare const forceSampleSchema: BooleanSchema;
//# sourceMappingURL=schemas.d.ts.map