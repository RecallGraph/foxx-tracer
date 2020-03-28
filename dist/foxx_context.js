'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
const opentracing = require('opentracing');

class FoxxContext extends opentracing.SpanContext {
    constructor(span) {
        super();
        // Store a reference to the span itself since this is a foxx tracer
        // intended to make debugging and unit testing easier.
        this._span = span;
        this._tracer = span.tracer();
    }

    span() {
        return this._span;
    }
    toTraceId() {
        return this._tracer.uuid();
    }
    toSpanId() {
        return this._span.uuid();
    }
}
exports.FoxxContext = FoxxContext;
exports.default = FoxxContext;
//# sourceMappingURL=foxx_context.js.map