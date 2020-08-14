"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.forceSampleSchema = exports.spanReqSchema = exports.spanArrSchema = exports.spanSchema = exports.referenceSchema = exports.logSchema = exports.tagsSchema = exports.contextSchema = exports.baggageSchema = exports.traceIdSchema = exports.spanIdSchema = void 0;
const joi_1 = require("joi");
const opentracing_1 = require("opentracing");
/** A 16 character string representing a span ID.
 *
 * @internal
 */
exports.spanIdSchema = joi_1.string().length(16);
/** A 16 or 32 character string representing a trace ID.
 *
 * @internal
 */
exports.traceIdSchema = joi_1.alternatives().try(exports.spanIdSchema, joi_1.string().length(32));
/** A valid JSON object.
 *
 * @internal
 */
exports.baggageSchema = joi_1.object();
/** A JSON object encoding a [span context](https://opentracing.io/specification/#spancontext).
 *
 * @internal
 */
exports.contextSchema = joi_1.object()
    .keys({
    trace_id: exports.traceIdSchema.required(),
    span_id: exports.spanIdSchema.required(),
    baggage: exports.baggageSchema.required()
})
    .unknown(true)
    .optionalKeys('baggage', 'trace_id');
/** A JSON object representing a [span tag](https://opentracing.io/specification/#set-a-span-tag).
 *
 * @internal
 */
exports.tagsSchema = joi_1.object()
    .pattern(/.+/, joi_1.alternatives().try(joi_1.string(), joi_1.boolean(), joi_1.number()).required());
/** A JSON object representing a [span log](https://opentracing.io/specification/#log-structured-data).
 *
 * @internal
 */
exports.logSchema = joi_1.object()
    .keys({
    fields: joi_1.object().pattern(/.+/, joi_1.any()).required(),
    timestamp: joi_1.number().required()
})
    .optionalKeys('timestamp');
/**
 * A JSON object representing a
 * [span reference](https://opentracing.io/specification/#references-between-spans).
 *
 * @internal
 */
exports.referenceSchema = joi_1.object()
    .keys({
    type: joi_1.string().valid(opentracing_1.REFERENCE_CHILD_OF, opentracing_1.REFERENCE_FOLLOWS_FROM).required(),
    context: exports.contextSchema.required()
});
/** A JSON object representing a [span](https://opentracing.io/specification/#the-opentracing-data-model).
 *
 * @internal
 */
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
/** An array of span objects, each adhering to the [[spanSchema | span schema]].
 *
 * @internal
 */
exports.spanArrSchema = joi_1.array().items(exports.spanSchema.required()).min(1);
/**
 * A single span or an array of spans, adhering to the [[spanSchema | span schema]] or the
 * [[spanArrSchema | span array schema]] respectively.
 *
 * @internal
 */
exports.spanReqSchema = joi_1.alternatives().try(exports.spanSchema, exports.spanArrSchema).required();
/** A boolean representing whether to force record or force suppress a trace.
 *
 * @internal
 */
exports.forceSampleSchema = joi_1.boolean();
//# sourceMappingURL=schemas.js.map