'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
const opentracing_1 = require('opentracing');
const foxx_span_1 = require('./foxx_span');

class FoxxTracer extends opentracing_1.Tracer {
    constructor() {
        super();
    }

    _extract(format, carrier) {
        throw new Error('NOT YET IMPLEMENTED');
    }

    _inject(span, format, carrier) {
        throw new Error('NOT YET IMPLEMENTED');
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
        span.initContext();
        this._currentContext = span.context();
        return span;
    }
}
exports.FoxxTracer = FoxxTracer;
exports.default = FoxxTracer;
//# sourceMappingURL=foxx_tracer.js.map