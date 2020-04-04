import Reporter from './Reporter';
import { REFERENCE_CHILD_OF, Tags } from 'opentracing'
import SpanData from '../SpanData';

const request = require('@arangodb/request');

type Record = {
    trace_id: number;
    span_id: number;
    name: string;
    resource: string;
    service: string;
    type: string;
    start: number;
    duration: number;
    parent_id?: number;
    error?: number;
    meta?: { [key: string]: string };
    metrics?: { [key: string]: number };
}

export default class DatadogReporter implements Reporter {
    private readonly ddURL: string;
    private readonly service: string;

    constructor(ddURL: string, service: string) {
        this.ddURL = ddURL;
        this.service = service;
    }

    report(traces: [[SpanData]]): void {
        const ddTraces = traces.map(trace => trace.map(span => {
            const record: Record = {
                duration: Math.floor((span.finishTimeMs - span.startTimeMs) * 1e6),
                name: span.operation,
                resource: span.operation,
                service: this.service,
                span_id: parseInt(span.context.span_id, 16),
                start: Math.floor(span.startTimeMs * 1e6),
                trace_id: parseInt(span.context.trace_id, 16),
                type: 'db'
            };

            const parent = span.references.find(ref => ref.type == REFERENCE_CHILD_OF);
            if (parent) {
                record.parent_id = parseInt(parent.context.span_id, 16);
            }

            const hasError = span.tags[Tags.ERROR];
            if (hasError) {
                record.error = 1;
            }

            record.meta = {};
            for (const key in span.tags) {
                if (span.tags.hasOwnProperty(key)) {
                    record.meta[key] = JSON.stringify(span.tags[key]);
                }
            }

            record.metrics = {};
            const logs = Object.assign({}, ...span.logs.map(log => log.fields));

            for (const key in logs) {
                if (logs.hasOwnProperty(key)) {
                    record.metrics[key] = parseFloat(logs[key]);
                }
            }

            return record;
        }));

        console.log(ddTraces);

        request.put(this.ddURL, {
            json: true,
            body: ddTraces,
            headers: {
                'X-Datadog-Trace-Count': `${ddTraces.length}`
            }
        });
    }
}