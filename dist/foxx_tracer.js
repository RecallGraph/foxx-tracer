'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
const opentracing_1 = require('opentracing');
const foxx_report_1 = require('./foxx_report');
const foxx_span_1 = require('./foxx_span');

class FoxxTracer extends opentracing_1.Tracer {
    //------------------------------------------------------------------------//
    // FoxxTracer-specific
    //------------------------------------------------------------------------//
    constructor() {
        super();
        this._spans = [];
    }

    /**
     * Return the buffered data in a format convenient for making unit test
     * assertions.
     */
    report() {
        return new foxx_report_1.default(this._spans);
    }
    _extract(format, carrier) {
        throw new Error('NOT YET IMPLEMENTED');
    }
    _inject(span, format, carrier) {
        throw new Error('NOT YET IMPLEMENTED');
    }

    /**
     * Discard any buffered data.
     */
    clear() {
        this._spans = [];
    }

    _allocSpan() {
        return new foxx_span_1.default(this);
    }

    get currentContext() {
        return this._currentContext;
    }

    set currentContext(value) {
        this._currentContext = value;
    }

    _startSpan(name, fields) {
        const span = this._allocSpan();
        span.setOperationName(name);
        this._spans.push(span);
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
        // Capture the stack at the time the span started
        span._startStack = new Error().stack;
        this._currentContext = span.context();
        return span;
    }
}
exports.FoxxTracer = FoxxTracer;
exports.default = FoxxTracer;
//# sourceMappingURL=foxx_tracer.js.map