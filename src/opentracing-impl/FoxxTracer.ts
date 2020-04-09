import { FORMAT_HTTP_HEADERS, FORMAT_TEXT_MAP, Span, SpanContext, SpanOptions, Tracer } from "opentracing";
import Reporter from "../reporters/Reporter";
import { TRACE_HEADER_KEYS, TraceHeaders } from "../helpers/utils";
import { Context, FoxxContext, FoxxSpan } from "..";

export abstract class ContextualTracer extends Tracer {
    abstract currentContext: FoxxContext;
    abstract reporter: Reporter;
}

export class FoxxTracer extends ContextualTracer {
    private _currentContext: FoxxContext;
    private readonly _reporter: Reporter;

    private static isHeader(carrier: any): carrier is TraceHeaders {
        const c = carrier as TraceHeaders;
        const { PARENT_SPAN_ID } = TRACE_HEADER_KEYS;

        return !!c[PARENT_SPAN_ID];
    }

    get currentContext(): FoxxContext {
        return this._currentContext;
    }

    constructor(reporter: Reporter) {
        super();

        this._reporter = reporter
    }

    set currentContext(value: FoxxContext) {
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
        if ((format as string) === FORMAT_HTTP_HEADERS && FoxxTracer.isHeader(carrier)) {
            const c = carrier as TraceHeaders;
            const { PARENT_SPAN_ID, TRACE_ID, BAGGAGE } = TRACE_HEADER_KEYS;
            const spanId = c[PARENT_SPAN_ID];
            const traceId = c[TRACE_ID];
            const baggage = c[BAGGAGE];

            return new FoxxContext(spanId, traceId, baggage);
        } else if ((format as string) === FORMAT_TEXT_MAP && FoxxTracer.isContext(carrier)) {
            const c = carrier as Context;

            return new FoxxContext(c.span_id, c.trace_id, c.baggage);
        }

        throw new Error('NOT YET IMPLEMENTED');
    }

    protected _inject(span: FoxxContext, format: any, carrier: any): void {
        if ((format as string) === FORMAT_TEXT_MAP && FoxxTracer.isContext(carrier)) {
            const c = carrier as Context;
            c.span_id = span.toSpanId();
            c.trace_id = span.toTraceId();
            c.baggage = span.baggage();
        } else {
            throw new Error('NOT YET IMPLEMENTED');
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

        span.initContext();
        this._currentContext = span.context() as FoxxContext;

        return span;
    }
}

export default FoxxTracer;
