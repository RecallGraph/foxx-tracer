import { FORMAT_HTTP_HEADERS, FORMAT_TEXT_MAP, Span, SpanContext, SpanOptions, Tracer } from "opentracing";
import Reporter from "../reporters/Reporter";
import { TRACE_HEADER_KEYS, TraceHeaders } from "../helpers/utils";
import { Context, FoxxContext, FoxxSpan } from "..";

export abstract class ContextualTracer extends Tracer {
    abstract currentContext: SpanContext;
    abstract reporter: Reporter;
    abstract currentTrace: string;
}

export class FoxxTracer extends ContextualTracer {
    private readonly _reporter: Reporter;
    private _currentContext: SpanContext;

    private _currentTrace: string;

    get currentTrace(): string {
        return this._currentTrace;
    }

    set currentTrace(value: string) {
        this._currentTrace = value;
    }

    private static isTraceHeaders(carrier: any): carrier is TraceHeaders {
        const c = carrier as TraceHeaders;
        const { TRACE_ID } = TRACE_HEADER_KEYS;

        return !!c[TRACE_ID];
    }

    constructor(reporter: Reporter) {
        super();

        this._reporter = reporter
    }

    get currentContext(): SpanContext {
        return this._currentContext;
    }

    set currentContext(value: SpanContext) {
        this._currentContext = value;
    }

    get reporter(): Reporter {
        return this._reporter;
    }

    private static isContext(carrier: any): carrier is Context {
        const c = carrier as Context;

        return !!c.span_id;
    }

    private static _allocSpan(): FoxxSpan {
        return new FoxxSpan();
    }

    protected _extract(format: any, carrier: any): SpanContext {
        if ((format as string) === FORMAT_HTTP_HEADERS && FoxxTracer.isTraceHeaders(carrier)) {
            const c = carrier as TraceHeaders;
            const { PARENT_SPAN_ID, TRACE_ID, BAGGAGE } = TRACE_HEADER_KEYS;

            if (c[PARENT_SPAN_ID]) {
                const spanId = c[PARENT_SPAN_ID];
                const traceId = c[TRACE_ID];
                const baggage = c[BAGGAGE];

                return new FoxxContext(spanId, traceId, baggage);
            } else {
                return null;
            }
        } else if ((format as string) === FORMAT_TEXT_MAP && FoxxTracer.isContext(carrier)) {
            const c = carrier as Context;

            return new FoxxContext(c.span_id, c.trace_id, c.baggage);
        }

        return null;
    }

    protected _inject(span: FoxxContext, format: any, carrier: any): void {
        if ((format as string) === FORMAT_TEXT_MAP && FoxxTracer.isContext(carrier)) {
            const c = carrier as Context;
            c.span_id = span.toSpanId();
            c.trace_id = span.toTraceId();
            c.baggage = span.baggage();
        }
    }

    protected _startSpan(name: string, fields: SpanOptions): Span {
        const span = FoxxTracer._allocSpan();
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

        span.initContext(this._currentTrace);
        this._currentContext = span.context() as FoxxContext;

        return span;
    }
}

export default FoxxTracer;
