import { FORMAT_HTTP_HEADERS, SpanContext, SpanOptions, Tracer } from "opentracing";
import FoxxContext from './FoxxContext';
import FoxxSpan from './FoxxSpan';
import Reporter from "../reporters/Reporter";
import { TRACE_HEADER_KEYS, TraceHeaders } from "../helpers/Utils";

export class FoxxTracer extends Tracer {
    private _currentContext: SpanContext;
    private readonly _reporter: Reporter;

    private static isHeader(carrier: any): carrier is TraceHeaders {
        const c = carrier as TraceHeaders;

        return !!(c[TRACE_HEADER_KEYS.SPAN_ID] || c[TRACE_HEADER_KEYS.PARENT_SPAN_ID]);
    }

    protected _extract(format: any, carrier: any): SpanContext {
        if ((format as string) === FORMAT_HTTP_HEADERS && FoxxTracer.isHeader(carrier)) {
            const c = carrier as TraceHeaders;

            const spanId = c[TRACE_HEADER_KEYS.SPAN_ID] || c[TRACE_HEADER_KEYS.PARENT_SPAN_ID];
            const traceId = c[TRACE_HEADER_KEYS.TRACE_ID];
            const baggage = c[TRACE_HEADER_KEYS.BAGGAGE];

            return new FoxxContext(spanId, traceId, baggage);
        }

        throw new Error('NOT YET IMPLEMENTED');
    }

    constructor(recorder: Reporter) {
        super();

        this._reporter = recorder
    }

    get reporter(): Reporter {
        return this._reporter;
    }

    protected _inject(span: FoxxContext, format: any, carrier: any): never {
        throw new Error('NOT YET IMPLEMENTED');
    }

    private _allocSpan(): FoxxSpan {
        return new FoxxSpan(this);
    }

    get currentContext(): SpanContext {
        return this._currentContext;
    }

    set currentContext(value: SpanContext) {
        this._currentContext = value;
    }

    protected _startSpan(name: string, fields: SpanOptions): FoxxSpan {
        const span = this._allocSpan();
        span.setOperationName(name);

        if (fields.references) {
            for (const ref of fields.references) {
                span.addReference(ref);
            }
        }
        if (fields.tags) {
            for (const tagKey in fields.tags) {
                span.setTag(tagKey, fields.tags[tagKey])
            }
        }

        span.initContext();
        this._currentContext = span.context();

        return span;
    }
}

export default FoxxTracer;
