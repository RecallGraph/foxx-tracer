export default interface SpanRecord {
    trace_id: number;
    span_id: number;
    name: string;
    resource: string;
    service: string;
    type?: string;
    start: number;
    duration: number;
    parent_id?: number;
    error?: number;
    meta?: { [key: string]: string };
    metrics?: { [key: string]: number };
}