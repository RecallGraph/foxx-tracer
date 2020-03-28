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
        this._uuid = FoxxTracer._generateUUID();
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

    static _generateUUID() {
        const p0 = `00000000${Math.abs((Math.random() * 0xFFFFFFFF) | 0).toString(16)}`.substr(-8);
        const p1 = `00000000${Math.abs((Math.random() * 0xFFFFFFFF) | 0).toString(16)}`.substr(-8);
        return `${p0}${p1}`;
    }

    uuid() {
        return this._uuid;
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
    _startSpan(name, fields) {
        // _allocSpan is given it's own method so that derived classes can
        // allocate any type of object they want, but not have to duplicate
        // the other common logic in startSpan().
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
        return span;
    }
    get currentContext() {
        return this._currentContext;
    }
    set currentContext(value) {
        this._currentContext = value;
    }
}
exports.FoxxTracer = FoxxTracer;
exports.default = FoxxTracer;
//# sourceMappingURL=foxx_tracer.js.map