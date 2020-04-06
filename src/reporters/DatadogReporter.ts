import Reporter from './Reporter';
import { REFERENCE_CHILD_OF } from 'opentracing'
import SpanData from '../helpers/SpanData';
import { COMPONENT, ERROR, SPAN_KIND } from "opentracing/lib/ext/tags";

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

    constructor(ddURL: string) {
        this.ddURL = ddURL;
    }

    report(traces: [[SpanData]]): void {
        const ddTraces = traces.map(trace => trace.map(span => {
            const record: Record = {
                duration: Math.floor((span.finishTimeMs - span.startTimeMs) * 1e6),
                name: span.operation,
                resource: (span.tags[COMPONENT] ? `${span.tags[COMPONENT]}-` : '') + span.operation,
                service: <string>span.tags.service || 'UNKNOWN',
                span_id: parseInt(span.context.span_id, 16),
                start: Math.floor(span.startTimeMs * 1e6),
                trace_id: parseInt(span.context.trace_id, 16),
                type: <string>span.tags[SPAN_KIND] || 'db'
            };

            const parent = span.references.find(ref => ref.type === REFERENCE_CHILD_OF);
            if (parent) {
                record.parent_id = parseInt(parent.context.span_id, 16);
            }

            const hasError = span.tags[ERROR];
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
                    const val = parseFloat(logs[key]);
                    if (Number.isFinite(val)) {
                        record.metrics[key] = val;
                    }
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