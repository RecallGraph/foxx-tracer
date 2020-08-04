export declare type TagValue = number | string | boolean;
export interface Tags {
    [key: string]: TagValue;
}
export interface Log {
    fields: {
        [key: string]: any;
    };
    timestamp?: number;
}
export interface Context {
    span_id: string;
    trace_id?: string;
    baggage?: object;
}
export interface Reference {
    type: string;
    context: Context;
}
export default interface SpanData {
    operation: string;
    context: Context;
    startTimeMs: number;
    finishTimeMs: number;
    tags?: Tags;
    logs?: Log[];
    references?: Reference[];
}
//# sourceMappingURL=SpanData.d.ts.map