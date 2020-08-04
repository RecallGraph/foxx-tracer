"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FoxxContext = void 0;
const opentracing_1 = require("opentracing");
class FoxxContext extends opentracing_1.SpanContext {
    constructor(spanId, traceId, baggage = {}) {
        super();
        this.context = {
            span_id: spanId,
            trace_id: traceId,
            baggage: baggage
        };
    }
    toTraceId() {
        return this.context.trace_id;
    }
    toSpanId() {
        return this.context.span_id;
    }
    baggage() {
        return this.context.baggage;
    }
}
exports.FoxxContext = FoxxContext;
exports.default = FoxxContext;
//# sourceMappingURL=FoxxContext.js.map