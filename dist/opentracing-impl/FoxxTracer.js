"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const opentracing_1 = require("opentracing");
const FoxxContext_1 = require("./FoxxContext");
const FoxxSpan_1 = require("./FoxxSpan");
const Utils_1 = require("../helpers/Utils");
const lodash_1 = require("lodash");
class FoxxTracer extends opentracing_1.Tracer {
    constructor(reporter) {
        super();
        this.noopTracer = new opentracing_1.Tracer();
        this._reporter = reporter;
    }
    static isHeader(carrier) {
        const c = carrier;
        return !!(c[Utils_1.TRACE_HEADER_KEYS.SPAN_ID] || c[Utils_1.TRACE_HEADER_KEYS.PARENT_SPAN_ID]);
    }
    _extract(format, carrier) {
        if (format === opentracing_1.FORMAT_HTTP_HEADERS && FoxxTracer.isHeader(carrier)) {
            const c = carrier;
            const spanId = c[Utils_1.TRACE_HEADER_KEYS.SPAN_ID] || c[Utils_1.TRACE_HEADER_KEYS.PARENT_SPAN_ID];
            const traceId = c[Utils_1.TRACE_HEADER_KEYS.TRACE_ID];
            const baggage = c[Utils_1.TRACE_HEADER_KEYS.BAGGAGE];
            return new FoxxContext_1.default(spanId, traceId, baggage);
        }
        return null;
    }
    get reporter() {
        return this._reporter;
    }
    _inject(span, format, carrier) {
        throw new Error('NOT YET IMPLEMENTED');
    }
    _allocSpan() {
        return new FoxxSpan_1.default(this);
    }
    get currentContext() {
        return this._currentContext;
    }
    set currentContext(value) {
        this._currentContext = value;
    }
    _startSpan(name, fields) {
        const forceSample = fields.tags && fields.tags.forceSample;
        let doTrace;
        if (lodash_1.isNil(forceSample)) {
            const samplingProbability = module.context.configuration['sampling-probability'];
            doTrace = Math.random() < samplingProbability;
        }
        else {
            doTrace = forceSample;
            delete fields.tags.forceSample;
        }
        let span;
        if (doTrace) {
            span = this._allocSpan();
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
        }
        else {
            span = this.noopTracer.startSpan(name, fields);
        }
        return span;
    }
}
exports.FoxxTracer = FoxxTracer;
exports.default = FoxxTracer;
//# sourceMappingURL=FoxxTracer.js.map