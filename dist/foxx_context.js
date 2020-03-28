'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
const opentracing = require('opentracing');

class FoxxContext extends opentracing.SpanContext {
    constructor(span) {
        super();
        // Store a reference to the span itself since this is a foxx tracer
        // intended to make debugging and unit testing easier.
        this._span = span;
    }

    span() {
        return this._span;
    }

    toTraceId() {
        return '';
    }

    toSpanId() {
        return '';
    }
}
exports.FoxxContext = FoxxContext;
exports.default = FoxxContext;
//# sourceMappingURL=foxx_context.js.map