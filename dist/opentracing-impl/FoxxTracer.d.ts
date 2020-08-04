import { Span, SpanContext, SpanOptions, Tracer } from "opentracing";
import Reporter from "../reporters/Reporter";
import { FoxxContext, SpanData } from "..";
export declare abstract class ContextualTracer extends Tracer {
    abstract currentContext: SpanContext;
    abstract currentTrace: string;
    abstract push(spanData: SpanData): any;
    abstract flush(traceId?: string): any;
}
export declare class FoxxTracer extends ContextualTracer {
    private _finishedSpans;
    private _currentContext;
    private _currentTrace;
    private readonly _reporter;
    private static isTraceHeaders;
    private static isContext;
    private static _allocSpan;
    constructor(reporter: Reporter);
    get currentContext(): SpanContext;
    set currentContext(value: SpanContext);
    get currentTrace(): string;
    set currentTrace(value: string);
    push(spanData: SpanData): void;
    flush(traceId?: string): void;
    protected _extract(format: any, carrier: any): SpanContext;
    protected _inject(span: FoxxContext, format: any, carrier: any): void;
    protected _startSpan(name: string, fields: SpanOptions): Span;
}
export default FoxxTracer;
//# sourceMappingURL=FoxxTracer.d.ts.map