"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const opentracing_1 = require("opentracing");
const lodash_1 = require("lodash");
const __1 = require("..");
const _arangodb_1 = require("@arangodb");
const tags_1 = require("opentracing/lib/ext/tags");
const joi = require('joi');
const tasks = require('@arangodb/tasks');
const tracer = opentracing_1.globalTracer();
const noopTracer = new opentracing_1.Tracer();
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
function getTraceDirectiveFromHeaders(headers) {
    const { PARENT_SPAN_ID, FORCE_SAMPLE } = TRACE_HEADER_KEYS;
    return lodash_1.get(headers, FORCE_SAMPLE, lodash_1.get(headers, PARENT_SPAN_ID) ? true : null);
}
exports.getTraceDirectiveFromHeaders = getTraceDirectiveFromHeaders;
function startSpan(name, options = {}, implicitParent = true, forceTrace) {
    let doTrace;
    let co = options.childOf;
    if (!co && implicitParent && tracer.currentContext) {
        co = options.childOf = tracer.currentContext;
    }
    if (lodash_1.isNil(forceTrace)) {
        if (co) {
            doTrace = co instanceof __1.FoxxContext || co instanceof __1.FoxxSpan;
        }
        else {
            const samplingProbability = module.context.configuration['sampling-probability'];
            doTrace = Math.random() < samplingProbability;
        }
    }
    else {
        doTrace = forceTrace;
    }
    return doTrace ? tracer.startSpan(name, options) : noopTracer.startSpan(name, options);
}
exports.startSpan = startSpan;
function instrumentEntryPoints() {
    const et = _arangodb_1.db._executeTransaction;
    _arangodb_1.db._executeTransaction = function (data) {
        const spanContext = tracer.inject(tracer.currentContext, opentracing_1.FORMAT_TEXT_MAP, {});
        data.params = {
            _parentContext: spanContext,
            _params: data.params,
            _action: data.action
        };
        data.action = function (params) {
            const { get } = require('lodash');
            const tracer = opentracing_1.globalTracer();
            tracer.currentContext = tracer.extract(opentracing_1.FORMAT_TEXT_MAP, get(params, '_parentContext'));
            return get(params, '_action').call(this, get(params, '_params'));
        };
        return et.call(_arangodb_1.db, data);
    };
    const rt = tasks.register;
    tasks.register = function (options) {
        const spanContext = tracer.inject(tracer.currentContext, opentracing_1.FORMAT_TEXT_MAP, {});
        options.params = {
            _parentContext: spanContext,
            _params: options.params,
            _cmd: options.command
        };
        options.command = function (params) {
            const { get } = require('lodash');
            const tracer = opentracing_1.globalTracer();
            tracer.currentContext = tracer.extract(opentracing_1.FORMAT_TEXT_MAP, get(params, '_parentContext'));
            params._cmd(params._params);
        };
        rt.call(tasks, options);
    };
}
exports.instrumentEntryPoints = instrumentEntryPoints;
function instrument(fn, operation, forceTrace) {
    operation = operation || fn.name;
    return function () {
        const options = {
            tags: {
                args: lodash_1.reject(arguments, lodash_1.isNil)
            }
        };
        const cc = tracer.currentContext;
        if (cc) {
            options.childOf = cc;
        }
        this.span = startSpan(operation, options, true, forceTrace);
        try {
            if (new.target) {
                return Reflect.construct(fn, arguments, new.target);
            }
            return fn.apply(this, arguments);
        }
        catch (e) {
            this.span.setTag(tags_1.ERROR, true);
            this.span.log({
                errorMessage: e.message
            });
        }
        finally {
            this.span.finish();
        }
    };
}
exports.instrument = instrument;
//# sourceMappingURL=utils.js.map