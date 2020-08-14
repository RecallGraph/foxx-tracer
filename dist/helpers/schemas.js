"use strict";
/**
 * This module exports a number of validation schemas that are used internally as well as by the collector
 * to validate incoming [[SpanData]].
 *
 * **This module is re-exported as a top-level export.**
 *
 * @packageDocumentation
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.TRACE_HEADER_SCHEMAS = exports.spanReqSchema = exports.spanArrSchema = exports.spanSchema = exports.referenceSchema = exports.logSchema = exports.tagsSchema = exports.contextSchema = exports.traceIdSchema = exports.spanIdSchema = void 0;
const dd = require("dedent");
const joi_1 = require("joi");
const opentracing_1 = require("opentracing");
const types_1 = require("./types");
/** A validation schema for a 16 character string representing a span ID. */
exports.spanIdSchema = joi_1.string().length(16);
/** A validation schema for a 16 or 32 character string representing a trace ID. */
exports.traceIdSchema = joi_1.alternatives().try(exports.spanIdSchema, joi_1.string().length(32));
/** A validation schema for a JSON object representing a [[Context | span context]]. */
exports.contextSchema = joi_1.object()
    .keys({
    trace_id: exports.traceIdSchema.required(),
    span_id: exports.spanIdSchema.required(),
    baggage: joi_1.object().required()
})
    .unknown(true)
    .optionalKeys('baggage', 'trace_id');
/** A validation schema for a JSON object representing a [[Tag | span tag]]. */
exports.tagsSchema = joi_1.object()
    .pattern(/.+/, joi_1.alternatives().try(joi_1.string(), joi_1.boolean(), joi_1.number()).required());
/** A validation schema for a JSON object representing a [[Log | span log]]. */
exports.logSchema = joi_1.object()
    .keys({
    fields: joi_1.object().pattern(/.+/, joi_1.any()).required(),
    timestamp: joi_1.number().required()
})
    .optionalKeys('timestamp');
/**
 * A validation schema for a JSON object representing a [[Reference | span reference]].
 */
exports.referenceSchema = joi_1.object()
    .keys({
    type: joi_1.string().valid(opentracing_1.REFERENCE_CHILD_OF, opentracing_1.REFERENCE_FOLLOWS_FROM).required(),
    context: exports.contextSchema.required()
});
/** A validation schema for a JSON object adhering to the [[SpanData]] interface. */
exports.spanSchema = joi_1.object()
    .keys({
    operation: joi_1.string().required(),
    context: exports.contextSchema.required(),
    startTimeMs: joi_1.number().required(),
    finishTimeMs: joi_1.number().required().min(joi_1.ref('startTimeMs')),
    tags: exports.tagsSchema.required(),
    logs: joi_1.array().items(exports.logSchema).min(0).required(),
    references: joi_1.array().items(exports.referenceSchema).min(0).required()
})
    .optionalKeys('tags', 'logs', 'references');
/** A validation schema for an array of span objects, each adhering to the [[spanSchema | span schema]]. */
exports.spanArrSchema = joi_1.array().items(exports.spanSchema.required()).min(1);
/**
 * A validation schema for a single span or an array of spans, adhering to the [[spanSchema | span schema]]
 * or the [[spanArrSchema | span array schema]] respectively.
 */
exports.spanReqSchema = joi_1.alternatives().try(exports.spanSchema, exports.spanArrSchema).required();
/**
 * @internal
 */
exports.TRACE_HEADER_SCHEMAS = Object.freeze({
    [types_1.TRACE_HEADER_KEYS.TRACE_ID]: {
        schema: exports.traceIdSchema,
        description: '64 or 128 bit trace id to use for creating spans.'
    },
    [types_1.TRACE_HEADER_KEYS.PARENT_SPAN_ID]: {
        schema: exports.spanIdSchema,
        description: dd `
      64 bit parent span id to use for creating spans.
      Must be accompanied by a ${types_1.TRACE_HEADER_KEYS.TRACE_ID}.
    `
    },
    [types_1.TRACE_HEADER_KEYS.BAGGAGE]: {
        schema: joi_1.object(),
        description: 'Context baggage. Must be a valid JSON object.'
    },
    [types_1.TRACE_HEADER_KEYS.FORCE_SAMPLE]: {
        schema: joi_1.boolean(),
        description: 'Boolean flag to force sampling on or off. Leave blank to let the tracer decide.'
    }
});
//# sourceMappingURL=schemas.js.map