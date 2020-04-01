'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
const opentracing_1 = require('opentracing');

class FoxxContext extends opentracing_1.SpanContext {
    constructor(traceId, spanId) {
        super();
        this.traceId = traceId;
        this.spanId = spanId;
    }

    toTraceId() {
        return this.traceId;
    }

    toSpanId() {
        return this.spanId;
    }
}
exports.FoxxContext = FoxxContext;
exports.default = FoxxContext;
//# sourceMappingURL=foxx_context.js.map