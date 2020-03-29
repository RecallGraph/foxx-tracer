'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
const opentracing = require('opentracing');

class FoxxContext extends opentracing.SpanContext {
    constructor(span) {
        super();
        this._span = span;
    }

    toTraceId() {
        const parent = this._span.getParent();
        return parent ? parent.toTraceId() : this._span.uuid();
    }

    toSpanId() {
        return this._span.uuid();
    }
}
exports.FoxxContext = FoxxContext;
exports.default = FoxxContext;
//# sourceMappingURL=foxx_context.js.map