import { Reference, Span, SpanContext } from 'opentracing';
import SpanData from '../helpers/SpanData';
export declare class FoxxSpan extends Span {
    private readonly _spanData;
    private readonly _refs;
    private _foxxContext;
    constructor();
    get spanData(): SpanData;
    static generateUUID(): string;
    initContext(traceId: string): void;
    addReference(ref: Reference): void;
    protected _setOperationName(name: string): void;
    protected _addTags(set: {
        [key: string]: any;
    }): void;
    protected _setBaggageItem(key: string, value: string): void;
    protected _getBaggageItem(key: string): string | undefined;
    protected _log(fields: {
        [key: string]: any;
    }, timestamp?: number): void;
    protected _context(): SpanContext;
    protected _finish(finishTime?: number): void;
    private getParent;
}
export default FoxxSpan;
//# sourceMappingURL=FoxxSpan.d.ts.map