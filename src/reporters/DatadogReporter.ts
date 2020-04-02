import Reporter from "./Reporter";
import FoxxSpan from "../foxx_span";
import { ERROR } from "opentracing/lib/ext/tags";

const tasks = require("@arangodb/tasks");

interface SpanRecord {
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

export default class DatadogReporter implements Reporter {
    private readonly ddURL: string;
    private readonly service: string;

    constructor(ddURL: string, service: string) {
        this.ddURL = ddURL;
        this.service = service;
    }

    report(traces: [[FoxxSpan]]): void {
        const ddTraces = traces.map(trace => trace.map(span => {
            const tags = span.tags();
            const record: SpanRecord = {
                duration: Math.floor(span.durationS() * 1e9),
                name: span.operationName(),
                resource: span.operationName(),
                service: this.service,
                span_id: parseInt(span.uuid(), 16),
                start: Math.floor(span.startS * 1e9),
                trace_id: parseInt(span.context().toTraceId(), 16),
                type: 'db'
            };

            const parent = span.getParent();
            if (parent) {
                record.parent_id = parseInt(parent.toSpanId(), 16);
            }

            const hasError = tags[ERROR];
            if (hasError) {
                record.error = 1;
            }

            record.meta = {};
            for (const key in tags) {
                record.meta[key] = JSON.stringify(tags[key]);
            }

            return record;
        }));


        // record.metrics = {};
        // const logs = Object.assign({}, ...span.logs().map(log => log.fields));
        //
        // for (const key in logs) {
        //     record.metrics[key] = parseFloat(logs[key]);
        // }
        console.log(ddTraces);

        // noinspection JSIgnoredPromiseFromCall
        tasks.register({
            command: function (params) {
                const request = require('@arangodb/request');
                const { traces: [], url } = params;

                request.put(url, {
                    json: true,
                    body: traces,
                    headers: {
                        "X-Datadog-Trace-Count": traces.length
                    }
                });
            },
            params: { traces: ddTraces, url: this.ddURL }
        });
    }
}