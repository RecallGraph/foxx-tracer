"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const opentracing_1 = require("opentracing");
const lodash_1 = require("lodash");
const __1 = require("..");
const _arangodb_1 = require("@arangodb");
const tags_1 = require("opentracing/lib/ext/tags");
const reporters_1 = require("../reporters");
const joi = require('joi');
const tasks = require('@arangodb/tasks');
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
    TRACE_HEADER_KEYS["TRACE_ID"] = "x-trace-id";
    TRACE_HEADER_KEYS["PARENT_SPAN_ID"] = "x-parent-span-id";
    TRACE_HEADER_KEYS["BAGGAGE"] = "x-baggage";
    TRACE_HEADER_KEYS["FORCE_SAMPLE"] = "x-force-sample";
})(TRACE_HEADER_KEYS = exports.TRACE_HEADER_KEYS || (exports.TRACE_HEADER_KEYS = {}));
const TRACE_HEADER_SCHEMAS = Object.freeze({
    [TRACE_HEADER_KEYS.TRACE_ID]: {
        schema: exports.traceIdSchema,
        description: '64 or 128 bit trace id to use for creating spans.'
    },
    [TRACE_HEADER_KEYS.PARENT_SPAN_ID]: {
        schema: exports.spanIdSchema,
        description: '64 bit parent span id to use for creating spans.'
    },
    [TRACE_HEADER_KEYS.BAGGAGE]: {
        schema: exports.baggageSchema,
        description: 'Context baggage.'
    },
    [TRACE_HEADER_KEYS.FORCE_SAMPLE]: {
        schema: exports.forceSampleSchema,
        description: 'Boolean flag to force sampling on or off. Leave blank to let the tracer decide.'
    }
});
function setEndpointTraceHeaders(endpoint) {
    for (const [key, value] of Object.entries(TRACE_HEADER_SCHEMAS)) {
        endpoint.header(key, value.schema, value.description);
    }
}
exports.setEndpointTraceHeaders = setEndpointTraceHeaders;
function parseTraceHeaders(headers) {
    headers = lodash_1.mapKeys(headers, (v, k) => k.toLowerCase());
    const traceHeaders = {};
    for (const [key, value] of Object.entries(TRACE_HEADER_SCHEMAS)) {
        const headerVal = lodash_1.get(headers, key);
        if (headerVal) {
            traceHeaders[key] = joi.validate(headerVal, value.schema).value;
        }
    }
    const { PARENT_SPAN_ID, TRACE_ID } = TRACE_HEADER_KEYS;
    if (traceHeaders[PARENT_SPAN_ID] && !traceHeaders[TRACE_ID]) {
        throw new Error('Parent span received without associated trace ID.');
    }
    return traceHeaders;
}
exports.parseTraceHeaders = parseTraceHeaders;
function setTrace(headers) {
    clearTraceContext();
    const { FORCE_SAMPLE } = TRACE_HEADER_KEYS;
    const forceSample = headers[FORCE_SAMPLE];
    if (forceSample === false) {
        return;
    }
    else if (forceSample === true) {
        setTraceContextFromHeaders(headers);
    }
    else {
        const samplingProbability = module.context.configuration['sampling-probability'];
        const doTrace = Math.random() < samplingProbability;
        if (doTrace) {
            setTraceContextFromHeaders(headers);
        }
    }
}
exports.setTrace = setTrace;
function setTraceContextFromHeaders(headers) {
    const tracer = opentracing_1.globalTracer();
    const { TRACE_ID } = TRACE_HEADER_KEYS;
    const traceId = headers[TRACE_ID] || __1.FoxxSpan.generateUUID();
    headers[TRACE_ID] = traceId;
    const rootContext = tracer.extract(opentracing_1.FORMAT_HTTP_HEADERS, headers);
    setTraceContext(traceId, rootContext);
}
function getParent(refs) {
    const parent = refs ? refs.find(ref => ref.type() === opentracing_1.REFERENCE_CHILD_OF) : null;
    console.debug(parent);
    return parent ? parent.referencedContext() : null;
}
exports.getParent = getParent;
function setTraceContext(traceID, context) {
    const tracer = opentracing_1.globalTracer();
    tracer.currentContext = context;
    tracer.currentTrace = traceID;
}
exports.setTraceContext = setTraceContext;
function clearTraceContext() {
    const tracer = opentracing_1.globalTracer();
    tracer.currentContext = null;
    tracer.currentTrace = null;
}
function startSpan(name, options = {}) {
    const tracer = opentracing_1.globalTracer();
    if (tracer.currentTrace) {
        const co = options.childOf || getParent(options.references);
        if (!co && tracer.currentContext) {
            options.childOf = tracer.currentContext;
        }
        return tracer.startSpan(name, options);
    }
    return noopTracer.startSpan(name, options);
}
exports.startSpan = startSpan;
function reportSpan(spanData) {
    const tracer = opentracing_1.globalTracer();
    tracer.reporter.report([[spanData]]);
}
exports.reportSpan = reportSpan;
function initTracer() {
    const reporter = new reporters_1.FoxxReporter();
    const tracer = new __1.FoxxTracer(reporter);
    opentracing_1.initGlobalTracer(tracer);
    const gTracer = opentracing_1.globalTracer();
    Object.defineProperty(gTracer, 'currentContext', {
        get() {
            return tracer.currentContext;
        },
        set(context) {
            tracer.currentContext = context;
        },
        enumerable: true,
        configurable: false
    });
    Object.defineProperty(gTracer, 'currentTrace', {
        get() {
            return tracer.currentTrace;
        },
        set(traceId) {
            tracer.currentTrace = traceId;
        },
        enumerable: true,
        configurable: false
    });
    Object.defineProperty(gTracer, 'reporter', {
        value: tracer.reporter,
        writable: false,
        enumerable: true,
        configurable: false
    });
}
exports.initTracer = initTracer;
function instrumentEntryPoints() {
    const tracer = opentracing_1.globalTracer();
    const et = _arangodb_1.db._executeTransaction;
    _arangodb_1.db._executeTransaction = function (data) {
        const spanContext = {};
        tracer.inject(tracer.currentContext, opentracing_1.FORMAT_TEXT_MAP, spanContext);
        data.params = {
            _traceId: tracer.currentTrace,
            _parentContext: spanContext,
            _params: data.params,
            _action: data.action
        };
        data.action = function (params) {
            const { get } = require('lodash');
            const { globalTracer } = require('opentracing');
            const tracer = globalTracer();
            const traceId = get(params, '_traceId');
            const rootContext = tracer.extract(opentracing_1.FORMAT_TEXT_MAP, get(params, '_parentContext'));
            clearTraceContext();
            setTraceContext(traceId, rootContext);
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
function attachSpan(fn, operation, options = {}, onSuccess, onError) {
    return function () {
        const optsCopy = lodash_1.cloneDeep(options);
        const span = startSpan(operation, optsCopy);
        try {
            let result;
            if (new.target) {
                result = Reflect.construct(fn, arguments, new.target);
            }
            else {
                result = fn.apply(this, arguments);
            }
            if (onSuccess) {
                onSuccess(result, span);
            }
            else {
                span.finish();
                return result;
            }
        }
        catch (e) {
            span.setTag(tags_1.ERROR, true);
            span.log({
                errorMessage: e.message
            });
            if (onError) {
                onError(e, span);
            }
            else {
                span.finish();
                throw e;
            }
        }
    };
}
exports.attachSpan = attachSpan;
//# sourceMappingURL=utils.js.map