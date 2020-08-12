"use strict";
/**
 * This module exports a number of utility functions that are used throughout the application
 * being traced. Some functions are specifically meant to be called at application startup to initialize the
 * global tracer, set up trace headers, etc.
 *
 * **This module is re-exported as a top-level export.**
 *
 * See the [quickstart](../index.html#quickstart) for a primer on how
 * to set up your application for tracing.
 * @packageDocumentation
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.instrumentedQuery = exports.attachSpan = exports.executeTask = exports.executeTransaction = exports.initTracer = exports.reportSpan = exports.startSpan = exports.clearTraceContext = exports.setTraceContext = exports.getParent = exports.setTrace = exports.parseTraceHeaders = exports.setEndpointTraceHeaders = exports.TRACE_HEADER_KEYS = exports.forceSampleSchema = exports.spanReqSchema = exports.spanArrSchema = exports.spanSchema = exports.referenceSchema = exports.logSchema = exports.tagsSchema = exports.contextSchema = exports.baggageSchema = exports.traceIdSchema = exports.spanIdSchema = void 0;
const opentracing_1 = require("opentracing");
const lodash_1 = require("lodash");
const __1 = require("..");
const _arangodb_1 = require("@arangodb");
const tags_1 = require("opentracing/lib/ext/tags");
const reporters_1 = require("../reporters");
const joi = require('joi');
const tasks = require('@arangodb/tasks');
const noopTracer = new opentracing_1.Tracer();
const { name, version } = module.context.manifest;
const service = `${name}-${version}`;
/** A 16 character string representing a span ID. */
exports.spanIdSchema = joi
    .string()
    .length(16);
/** A 16 or 32 character string representing a trace ID. */
exports.traceIdSchema = joi
    .alternatives()
    .try(exports.spanIdSchema, joi
    .string()
    .length(32));
/** A valid JSON object. */
exports.baggageSchema = joi.object();
/** A JSON object encoding a [span context](https://opentracing.io/specification/#spancontext). */
exports.contextSchema = joi
    .object()
    .keys({
    trace_id: exports.traceIdSchema.required(),
    span_id: exports.spanIdSchema.required(),
    baggage: exports.baggageSchema.required()
})
    .unknown(true)
    .optionalKeys('baggage', 'trace_id');
/** A JSON object representing a [span tag](https://opentracing.io/specification/#set-a-span-tag). */
exports.tagsSchema = joi
    .object()
    .pattern(/.+/, joi
    .alternatives()
    .try(joi.string(), joi.boolean(), joi.number())
    .required());
/** A JSON object representing a [span log](https://opentracing.io/specification/#log-structured-data). */
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
/**
 * A JSON object representing a
 * [span reference](https://opentracing.io/specification/#references-between-spans).
 */
exports.referenceSchema = joi
    .object()
    .keys({
    type: joi
        .string()
        .valid(opentracing_1.REFERENCE_CHILD_OF, opentracing_1.REFERENCE_FOLLOWS_FROM)
        .required(),
    context: exports.contextSchema.required()
});
/** A JSON object representing a [span](https://opentracing.io/specification/#the-opentracing-data-model). */
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
        .min(0)
        .required(),
    references: joi
        .array()
        .items(exports.referenceSchema.required())
        .required()
})
    .optionalKeys('tags', 'logs', 'references');
/** An array of span objects, each adhering to the [[spanSchema | span schema]]. */
exports.spanArrSchema = joi
    .array()
    .items(exports.spanSchema.required())
    .min(1);
/**
 * A single span or an array of spans, adhering to the [[spanSchema | span schema]] or the
 * [[spanArrSchema | span array schema]] respectively.
 */
exports.spanReqSchema = joi
    .alternatives()
    .try(exports.spanSchema, exports.spanArrSchema)
    .required();
/** A boolean representing whether to force record or force suppress a trace. */
exports.forceSampleSchema = joi.boolean();
/** The HTTP header keys that are used to control tracing behaviour and for setting trace context. */
var TRACE_HEADER_KEYS;
(function (TRACE_HEADER_KEYS) {
    /**
     * The trace ID under which to record all new spans. If unspecified, a new trace is started and is
     * assigned a randomly generated [[FoxxSpan.generateUUID | UUID]].
     *
     * Note that if a new trace is started by *foxx-tracer*, the subsequent root span's span ID will **not**
     * be same as the generated trace ID.
     */
    TRACE_HEADER_KEYS["TRACE_ID"] = "x-trace-id";
    /**
     * A span ID (belonging to an ongoing trace) under which to create the top level span of the traced request.
     * This header **must be accompanied** by a non-emtpy [[TRACE_HEADER_KEYS.TRACE_ID | TRACE_ID]] header.
     * All spans generated with the application will now have this span ID as an ancestor.
     */
    TRACE_HEADER_KEYS["PARENT_SPAN_ID"] = "x-parent-span-id";
    /**
     * A JSON object containing key-value pairs that will set as the
     * [baggage](https://opentracing.io/specification/#set-a-baggage-item) for all spans recorded for this
     * request.
     */
    TRACE_HEADER_KEYS["BAGGAGE"] = "x-baggage";
    /**
     * An optional boolean that control whether the decision to record a trace should be forced,
     * suppressed or be left to the application to decide. If `true` a sample is forced. If `false` no sample
     * is taken. If left blank, the application decides based on the `sampling-probability` configuration
     * parameter (TODO: Add link to param docs).
     */
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
/**
 * @ignore
 */
function setEndpointTraceHeaders(endpoint) {
    for (const [key, value] of Object.entries(TRACE_HEADER_SCHEMAS)) {
        endpoint.header(key, value.schema, value.description);
    }
}
exports.setEndpointTraceHeaders = setEndpointTraceHeaders;
/**
 * @ignore
 */
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
/**
 * @ignore
 */
function setTrace(headers) {
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
/**
 * Returns a parent context (if found) from the input array of references.
 *
 * @param refs The [Reference](https://opentracing-javascript.surge.sh/classes/reference.html) array.
 *
 * @return The [SpanContext](https://opentracing-javascript.surge.sh/classes/spancontext.html) of the
 * reference representing the parent, if found, `null` otherwise.
 */
function getParent(refs) {
    const parent = refs ? refs.find(ref => ref.type() === opentracing_1.REFERENCE_CHILD_OF) : null;
    return parent ? parent.referencedContext() : null;
}
exports.getParent = getParent;
/**
 * @ignore
 */
function setTraceContext(traceID, context) {
    const tracer = opentracing_1.globalTracer();
    tracer.currentContext = context;
    tracer.currentTrace = traceID;
}
exports.setTraceContext = setTraceContext;
/**
 * Clears the global tracer's memory of all trace and span context. Useful when it is desired to manually
 * start a fresh trace. Normally required only in test suite runs.
 */
function clearTraceContext() {
    const tracer = opentracing_1.globalTracer();
    const traceId = tracer.currentTrace;
    tracer.currentContext = null;
    tracer.currentTrace = null;
    if (traceId) {
        tracer.flush(traceId);
    }
}
exports.clearTraceContext = clearTraceContext;
/**
 * Start a new span. Useful when it is desired to manually start a fresh trace. Normally required only in
 * test suite runs.
 *
 * @param name The operation name to be recorded in the span.
 * @param options The
 * optional [SpanOptions](https://opentracing-javascript.surge.sh/interfaces/spanoptions.html) object that
 * describes the span.
 *
 * @return The created [Span](https://opentracing-javascript.surge.sh/classes/span.html).
 */
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
/**
 * @ignore
 */
function reportSpan(spanData) {
    const tracer = opentracing_1.globalTracer();
    tracer.push(spanData);
}
exports.reportSpan = reportSpan;
/**
 * Initializes the global tracer at application startup. This should be called as early as possible (and only
 * once) when application starts.
 */
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
    Object.defineProperty(gTracer, 'push', {
        value: tracer.push.bind(tracer),
        writable: false,
        enumerable: true,
        configurable: false
    });
    Object.defineProperty(gTracer, 'flush', {
        value: tracer.flush.bind(tracer),
        writable: false,
        enumerable: true,
        configurable: false
    });
}
exports.initTracer = initTracer;
/**
 * Start a [transaction](https://www.arangodb.com/docs/3.6/transactions-transaction-invocation.html) while
 * ensuring that the trace context is correctly propagated over to the V8 context where the transaction is
 * actually run. The command executed by the transaction is wrapped in a new span which carries the same
 * trace context that was active in the V8 context that invoked the transaction.
 *
 * @param data The
 * [Transaction](https://github.com/DefinitelyTyped/DefinitelyTyped/blob/bbc8c7c7b7e92ba094ea349d56977e00f6f7f42d/types/arangodb/index.d.ts#L910)
 * description.
 * @param operation The operation name to be recorded in the span.
 * @param options The
 * optional [SpanOptions](https://opentracing-javascript.surge.sh/interfaces/spanoptions.html) object that
 * describes the span.
 */
function executeTransaction(data, operation, options = {}) {
    const tracer = opentracing_1.globalTracer();
    let spanContext = null;
    if (tracer.currentContext) {
        spanContext = {};
        tracer.inject(tracer.currentContext, opentracing_1.FORMAT_TEXT_MAP, spanContext);
    }
    const wrappedData = lodash_1.omit(data, 'action', 'params');
    wrappedData.params = {
        _traceId: tracer.currentTrace,
        _parentContext: spanContext,
        _params: data.params,
        _action: data.action,
        _operation: operation,
        _options: options
    };
    wrappedData.action = function (params) {
        const { globalTracer } = require('opentracing');
        const tracer = globalTracer();
        const { _parentContext, _action, _operation, _options, _params, _traceId } = params;
        const rootContext = tracer.extract(opentracing_1.FORMAT_TEXT_MAP, _parentContext);
        setTraceContext(_traceId, rootContext);
        const result = attachSpan(_action, _operation, _options).call(params, _params);
        clearTraceContext();
        return result;
    };
    return _arangodb_1.db._executeTransaction(wrappedData);
}
exports.executeTransaction = executeTransaction;
/**
 * Registers a [task](https://www.arangodb.com/docs/3.6/appendix-java-script-modules-tasks.html) while
 * ensuring that the trace context is correctly propagated over to the V8 context where the task is actually
 * run. The function executed by the task is wrapped in a new span which carries the same trace context that
 * was active at the time of registering the task.
 *
 * @param task The object describing the task.
 * @param operation The operation name to be recorded in the span.
 * @param options The
 * optional [SpanOptions](https://opentracing-javascript.surge.sh/interfaces/spanoptions.html) object that
 * describes the span.
 */
function executeTask(task, operation, options = {}) {
    const tracer = opentracing_1.globalTracer();
    let spanContext = null;
    if (tracer.currentContext) {
        spanContext = {};
        tracer.inject(tracer.currentContext, opentracing_1.FORMAT_TEXT_MAP, spanContext);
    }
    const wrappedOptions = lodash_1.omit(task, 'command', 'params');
    wrappedOptions.params = {
        _traceId: tracer.currentTrace,
        _parentContext: spanContext,
        _params: task.params,
        _command: task.command,
        _operation: operation,
        _options: options
    };
    wrappedOptions.command = function (params) {
        const { globalTracer } = require('opentracing');
        const tracer = globalTracer();
        const { _parentContext, _command, _operation, _options, _params, _traceId } = params;
        const rootContext = tracer.extract(opentracing_1.FORMAT_TEXT_MAP, _parentContext);
        setTraceContext(_traceId, rootContext);
        attachSpan(_command, _operation, _options).call(params, _params);
        clearTraceContext();
    };
    tasks.register(wrappedOptions);
}
exports.executeTask = executeTask;
/**
 * Creates a wrapper around the input function that, when invoked, executes the given function inside a new
 * span. When you don't need to manually alter the span before it is closed and reported, the success
 * and error callbacks can be omitted. In this case, when the function ends, it either returns its result
 * (or void) back to the caller or throws an error. In both cases, the span enclosing the function's
 * execution is always properly closed and reported, enriched with additional error information, if
 * applicable.
 *
 * On the other hand, when you need access to the span (at the end of the function) just before it is
 * finalized, you can specify the success and error callbacks, within which you will have access to the span.
 * You can now add your custom tags/logs to the span.
 *
 * **The span must be explicity closed in the body of both
 * callbacks** by invoking its [finish](https://opentracing-javascript.surge.sh/classes/span.html#finish)
 * method.
 *
 * @param fn The function to be wrapped in a span.
 * @param operation The operation name to be recorded in the span.
 * @param options The
 * optional [SpanOptions](https://opentracing-javascript.surge.sh/interfaces/spanoptions.html) object that
 * describes the span.
 * @param onSuccess The optional success callback.
 * @param onError The optional error callback.
 *
 * @return The wrapper function that accepts the same arguments as *fn*.
 */
function attachSpan(fn, operation, options = {}, onSuccess, onError) {
    return function () {
        const optsCopy = lodash_1.defaultsDeep({}, options, { tags: { service } });
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
/**
 * Executes the given query inside a new span and returns the resultant cursor. The enclosing span records
 * query stats (available within the cursor object) in its logs.
 *
 * @param query The AQL
 * [Query](https://github.com/DefinitelyTyped/DefinitelyTyped/blob/bbc8c7c7b7e92ba094ea349d56977e00f6f7f42d/types/arangodb/index.d.ts#L771)
 * to execute.
 * @param operation The operation name to be recorded in the span.
 * @param options The
 * optional [SpanOptions](https://opentracing-javascript.surge.sh/interfaces/spanoptions.html) object that
 * describes the span.
 *
 * @return The
 * [Cursor](https://github.com/DefinitelyTyped/DefinitelyTyped/blob/bbc8c7c7b7e92ba094ea349d56977e00f6f7f42d/types/arangodb/index.d.ts#L781)
 * that is created as a result of running the query.
 */
function instrumentedQuery(query, operation, options = {}) {
    const optsCopy = lodash_1.defaultsDeep({}, options, { tags: { service } });
    lodash_1.defaultsDeep(optsCopy, {
        tags: lodash_1.filter({
            query: query.query,
            bindVars: JSON.stringify(query.bindVars),
            options: JSON.stringify(query.options)
        }, lodash_1.identity)
    });
    const span = startSpan(operation, optsCopy);
    const cursor = _arangodb_1.db._query(query);
    span.log(cursor.getExtra());
    span.finish();
    return cursor;
}
exports.instrumentedQuery = instrumentedQuery;
//# sourceMappingURL=utils.js.map