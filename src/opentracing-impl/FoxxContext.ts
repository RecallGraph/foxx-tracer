import { SpanContext } from "opentracing";
import { Context } from '..'

export class FoxxContext extends SpanContext {
    private readonly context: Context;

    constructor(traceId: string, spanId: string) {
        super();

        this.context = {
            span_id: spanId,
            trace_id: traceId,
            baggage: {}
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
