"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const opentracing_1 = require("opentracing");
const utils_1 = require("../helpers/utils");
const __1 = require("..");
class ContextualTracer extends opentracing_1.Tracer {
}
exports.ContextualTracer = ContextualTracer;
class FoxxTracer extends ContextualTracer {
    constructor(reporter) {
        super();
        this._reporter = reporter;
    }
    static isTraceHeaders(carrier) {
        const c = carrier;
        const { TRACE_ID } = utils_1.TRACE_HEADER_KEYS;
        return !!c[TRACE_ID];
    }
    static isContext(carrier) {
        const c = carrier;
        return !!c.span_id;
    }
    static _allocSpan() {
        return new __1.FoxxSpan();
    }
    get currentContext() {
        return this._currentContext;
    }
    set currentContext(value) {
        this._currentContext = value;
    }
    get reporter() {
        return this._reporter;
    }
    get currentTrace() {
        return this._currentTrace;
    }
    set currentTrace(value) {
        this._currentTrace = value;
    }
    _extract(format, carrier) {
        if (format === opentracing_1.FORMAT_HTTP_HEADERS && FoxxTracer.isTraceHeaders(carrier)) {
            const c = carrier;
            const { PARENT_SPAN_ID, TRACE_ID, BAGGAGE } = utils_1.TRACE_HEADER_KEYS;
            if (c[PARENT_SPAN_ID]) {
                const spanId = c[PARENT_SPAN_ID];
                const traceId = c[TRACE_ID];
                const baggage = c[BAGGAGE];
                return new __1.FoxxContext(spanId, traceId, baggage);
            }
            else {
                return null;
            }
        }
        else if (format === opentracing_1.FORMAT_TEXT_MAP && FoxxTracer.isContext(carrier)) {
            const c = carrier;
            return new __1.FoxxContext(c.span_id, c.trace_id, c.baggage);
        }
        return null;
    }
    _inject(span, format, carrier) {
        if (format === opentracing_1.FORMAT_TEXT_MAP && FoxxTracer.isContext(carrier)) {
            const c = carrier;
            c.span_id = span.toSpanId();
            c.trace_id = span.toTraceId();
            c.baggage = span.baggage();
        }
        else {
            throw new Error('NOT YET IMPLEMENTED');
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
        this._currentContext = span.context();
        return span;
    }
}
exports.FoxxTracer = FoxxTracer;
exports.default = FoxxTracer;
//# sourceMappingURL=FoxxTracer.js.map