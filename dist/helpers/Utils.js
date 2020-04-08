"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const opentracing_1 = require("opentracing");
const joi = require('joi');
exports.spanIdSchema = joi
    .string()
    .length(16);
exports.traceIdSchema = joi
    .alternatives()
    .try(exports.spanIdSchema, joi
    .string()
    .length(32));
exports.baggageSchema = joi.object();
exports.contextSchema = joi
    .object()
    .keys({
    trace_id: exports.traceIdSchema.required(),
    span_id: exports.spanIdSchema.required(),
    baggage: exports.baggageSchema.required()
})
    .unknown(true)
    .optionalKeys('baggage', 'trace_id');
exports.tagsSchema = joi
    .object()
    .pattern(/.+/, joi
    .alternatives()
    .try(joi.string(), joi.boolean(), joi.number())
    .required());
exports.logSchema = joi
    .object()
    .keys({
    fields: joi
        .object()
        .pattern(/.+/, joi.any())
        .required(),
    timestamp: joi
        .number()
        .required()
})
    .optionalKeys('timestamp');
exports.referenceSchema = joi
    .object()
    .keys({
    type: joi
        .string()
        .valid(opentracing_1.REFERENCE_CHILD_OF, opentracing_1.REFERENCE_FOLLOWS_FROM)
        .required(),
    context: exports.contextSchema.required()
});
exports.spanSchema = joi
    .object()
    .keys({
    operation: joi
        .string()
        .required(),
    context: exports.contextSchema.required(),
    startTimeMs: joi
        .number()
        .required(),
    finishTimeMs: joi
        .number()
        .required()
        .min(joi.ref('startTimeMs')),
    tags: exports.tagsSchema.required(),
    logs: joi
        .array()
        .items(exports.logSchema.required())
        .required(),
    references: joi
        .array()
        .items(exports.referenceSchema.required())
        .required()
})
    .optionalKeys('tags', 'logs', 'references');
exports.spanArrSchema = joi
    .array()
    .items(exports.spanSchema.required())
    .min(1);
exports.spanReqSchema = joi
    .alternatives()
    .try(exports.spanSchema, exports.spanArrSchema)
    .required();
exports.forceSampleSchema = joi.boolean();
var TRACE_HEADER_KEYS;
(function (TRACE_HEADER_KEYS) {
    TRACE_HEADER_KEYS["TRACE_ID"] = "X-Trace-ID";
    TRACE_HEADER_KEYS["PARENT_SPAN_ID"] = "X-Parent-Span-ID";
    TRACE_HEADER_KEYS["BAGGAGE"] = "X-Baggage";
    TRACE_HEADER_KEYS["FORCE_SAMPLE"] = "X-Force-Sample";
})(TRACE_HEADER_KEYS = exports.TRACE_HEADER_KEYS || (exports.TRACE_HEADER_KEYS = {}));
function setTracerHeaders(endpoint) {
    endpoint.header(TRACE_HEADER_KEYS.TRACE_ID, exports.traceIdSchema, '64 or 128 bit trace id to use for creating spans.');
    endpoint.header(TRACE_HEADER_KEYS.PARENT_SPAN_ID, exports.spanIdSchema, '64 bit parent span id to use for creating spans.');
    endpoint.header(TRACE_HEADER_KEYS.BAGGAGE, exports.baggageSchema, 'Context baggage.');
    endpoint.header(TRACE_HEADER_KEYS.FORCE_SAMPLE, exports.forceSampleSchema, 'Boolean flag to force sampling on or off. ' +
        'Leave blank to let the tracer decide.');
}
exports.setTracerHeaders = setTracerHeaders;
//# sourceMappingURL=Utils.js.map