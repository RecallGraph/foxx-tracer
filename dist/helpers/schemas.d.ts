/**
 * This module exports a number of validation schemas that are used internally as well as by the collector
 * to validate incoming [[SpanData]].
 *
 * **This module is re-exported as a top-level export.**
 *
 * @packageDocumentation
 */
import { AlternativesSchema, ArraySchema, ObjectSchema, StringSchema } from 'joi';
/** A validation schema for a 16 character string representing a span ID. */
export declare const spanIdSchema: StringSchema;
/** A validation schema for a 16 or 32 character string representing a trace ID. */
export declare const traceIdSchema: AlternativesSchema;
/** A validation schema for a JSON object representing a [[Context | span context]]. */
export declare const contextSchema: ObjectSchema;
/** A validation schema for a JSON object representing a [[Tag | span tag]]. */
export declare const tagsSchema: ObjectSchema;
/** A validation schema for a JSON object representing a [[Log | span log]]. */
export declare const logSchema: ObjectSchema;
/**
 * A validation schema for a JSON object representing a [[Reference | span reference]].
 */
export declare const referenceSchema: ObjectSchema;
/** A validation schema for a JSON object adhering to the [[SpanData]] interface. */
export declare const spanSchema: ObjectSchema;
/** A validation schema for an array of span objects, each adhering to the [[spanSchema | span schema]]. */
export declare const spanArrSchema: ArraySchema;
/**
 * A validation schema for a single span or an array of spans, adhering to the [[spanSchema | span schema]]
 * or the [[spanArrSchema | span array schema]] respectively.
 */
export declare const spanReqSchema: AlternativesSchema;
//# sourceMappingURL=schemas.d.ts.map