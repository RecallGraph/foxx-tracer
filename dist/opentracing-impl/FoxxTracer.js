"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const opentracing_1 = require("opentracing");
const utils_1 = require("../helpers/utils");
const lodash_1 = require("lodash");
const __1 = require("..");
class FoxxTracer extends opentracing_1.Tracer {
    constructor(reporter) {
        super();
        this.noopTracer = new opentracing_1.Tracer();
        this._reporter = reporter;
    }
    static isHeader(carrier) {
        const c = carrier;
        const { PARENT_SPAN_ID } = utils_1.TRACE_HEADER_KEYS;
        return !!c[PARENT_SPAN_ID];
    }
    get currentContext() {
        return this._currentContext;
    }
    set currentContext(value) {
        this._currentContext = value;
    }
    get reporter() {
        return this._reporter;
    }
    static isContext(carrier) {
        const c = carrier;
        return !!c.span_id;
    }
    static _allocSpan() {
        return new __1.FoxxSpan();
    }
    _extract(format, carrier) {
        if (format === opentracing_1.FORMAT_HTTP_HEADERS && FoxxTracer.isHeader(carrier)) {
            const c = carrier;
            const { PARENT_SPAN_ID, TRACE_ID, BAGGAGE } = utils_1.TRACE_HEADER_KEYS;
            const spanId = c[PARENT_SPAN_ID];
            const traceId = c[TRACE_ID];
            const baggage = c[BAGGAGE];
            return new __1.FoxxContext(spanId, traceId, baggage);
        }
        else if (format === opentracing_1.FORMAT_TEXT_MAP && FoxxTracer.isContext(carrier)) {
            const c = carrier;
            return new __1.FoxxContext(c.span_id, c.trace_id, c.baggage);
        }
        throw new Error('NOT YET IMPLEMENTED');
    }
    _inject(span, format, carrier) {
        if (format === opentracing_1.FORMAT_TEXT_MAP && FoxxTracer.isContext(carrier)) {
            const c = carrier;
            c.span_id = span.toSpanId();
            c.trace_id = span.toTraceId();
            c.baggage = span.baggage();
        }
        else {
            throw new Error('NOT YET IMPLEMENTED');
        }
    }
    _startSpan(name, fields) {
        const { PARENT_SPAN_ID, FORCE_SAMPLE } = utils_1.TRACE_HEADER_KEYS;
        const forceSample = lodash_1.get(fields, ['tags', FORCE_SAMPLE], lodash_1.get(fields, ['tags', PARENT_SPAN_ID]));
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
            span = FoxxTracer._allocSpan();
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