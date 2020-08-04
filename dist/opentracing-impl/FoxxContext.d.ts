import { SpanContext } from "opentracing";
export declare class FoxxContext extends SpanContext {
    private readonly context;
    constructor(spanId: string, traceId?: string, baggage?: object);
    toTraceId(): string;
    toSpanId(): string;
    baggage(): object;
}
export default FoxxContext;
//# sourceMappingURL=FoxxContext.d.ts.map