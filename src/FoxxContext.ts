import { SpanContext } from "opentracing";

export class FoxxContext extends SpanContext {
    private readonly traceId: string;
    private readonly spanId: string;

    constructor(traceId: string, spanId: string) {
        super();

        this.traceId = traceId;
        this.spanId = spanId;
    }

    toTraceId(): string {
        return this.traceId;
    }

    toSpanId(): string {
        return this.spanId;
    }
}

export default FoxxContext;
