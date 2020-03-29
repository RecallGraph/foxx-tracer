'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
const opentracing = require('opentracing');

class FoxxContext extends opentracing.SpanContext {
    constructor(span) {
        super();
        this._spanId = span.uuid();
        const parent = span.getParent();
        this._traceId = parent ? parent.toTraceId() : span.uuid();
    }

    toTraceId() {
        return this._traceId;
    }
    toSpanId() {
        return this._spanId;
    }
}
exports.FoxxContext = FoxxContext;
exports.default = FoxxContext;
//# sourceMappingURL=foxx_context.js.map