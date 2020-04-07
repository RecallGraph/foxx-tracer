import { SpanContext } from "opentracing";
import { Context } from '..'

export class FoxxContext extends SpanContext {
    private readonly context: Context;

    constructor(spanId: string, traceId?: string, baggage?: object) {
        super();

        this.context = {
            span_id: spanId,
            trace_id: traceId,
            baggage: baggage
        };
    }

    toTraceId(): string {
        return this.context.trace_id;
    }

    toSpanId(): string {
        return this.context.span_id;
    }

    baggage() {
        return this.context.baggage;
    }
}

export default FoxxContext;
