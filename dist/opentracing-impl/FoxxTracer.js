"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FoxxTracer = exports.ContextualTracer = void 0;
const opentracing_1 = require("opentracing");
const utils_1 = require("../helpers/utils");
const FoxxContext_1 = require("./FoxxContext");
const FoxxSpan_1 = require("./FoxxSpan");
const lodash_1 = require("lodash");
class ContextualTracer extends opentracing_1.Tracer {
}
exports.ContextualTracer = ContextualTracer;
class FoxxTracer extends ContextualTracer {
    constructor(reporter) {
        super();
        this._finishedSpans = {};
        this._reporter = reporter;
    }
    static isTraceHeaders(carrier) {
        const c = carrier;
        const { TRACE_ID } = utils_1.TRACE_HEADER_KEYS;
        return !!c[TRACE_ID];
    }
    static isContext(carrier) {
        const c = carrier;
        return !!(c && c.span_id);
    }
    static _allocSpan() {
        return new FoxxSpan_1.default();
    }
    get currentContext() {
        return this._currentContext;
    }
    set currentContext(value) {
        this._currentContext = value;
    }
    get currentTrace() {
        return this._currentTrace;
    }
    set currentTrace(value) {
        this._currentTrace = value;
    }
    push(spanData) {
        const traceId = spanData.context.trace_id;
        if (!this._finishedSpans[traceId]) {
            this._finishedSpans[traceId] = [spanData];
        }
        else {
            this._finishedSpans[traceId].push(spanData);
        }
    }
    flush(traceId) {
        if (traceId) {
            this._reporter.report([this._finishedSpans[traceId]]);
            delete this._finishedSpans[traceId];
        }
        else {
            this._reporter.report(Object.values(this._finishedSpans));
            this._finishedSpans = {};
        }
    }
    _extract(format, carrier) {
        if (format === opentracing_1.FORMAT_HTTP_HEADERS && FoxxTracer.isTraceHeaders(carrier)) {
            const c = carrier;
            const { PARENT_SPAN_ID, TRACE_ID, BAGGAGE } = utils_1.TRACE_HEADER_KEYS;
            if (c[PARENT_SPAN_ID]) {
                const spanId = c[PARENT_SPAN_ID];
                const traceId = c[TRACE_ID];
                const baggage = c[BAGGAGE];
                return new FoxxContext_1.default(spanId, traceId, baggage);
            }
            else {
                return null;
            }
        }
        else if (format === opentracing_1.FORMAT_TEXT_MAP && FoxxTracer.isContext(carrier)) {
            const c = carrier;
            return new FoxxContext_1.default(c.span_id, c.trace_id, c.baggage);
        }
        return null;
    }
    _inject(span, format, carrier) {
        if (format === opentracing_1.FORMAT_TEXT_MAP && lodash_1.isObjectLike(carrier)) {
            const c = carrier;
            c.span_id = span.toSpanId();
            c.trace_id = span.toTraceId();
            c.baggage = span.baggage();
        }
    }
    _startSpan(name, fields) {
        const span = FoxxTracer._allocSpan();
        span.setOperationName(name);
        if (fields.references) {
            for (const ref of fields.references) {
                span.addReference(ref);
            }
        }
        if (fields.tags) {
            for (const tagKey in fields.tags) {
                span.setTag(tagKey, fields.tags[tagKey]);
            }
        }
        span.initContext(this._currentTrace);
        return span;
    }
}
exports.FoxxTracer = FoxxTracer;
exports.default = FoxxTracer;
//# sourceMappingURL=FoxxTracer.js.map