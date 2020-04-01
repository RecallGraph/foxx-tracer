import Recorder from "./Recorder";
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

export default class DatadogRecorder implements Recorder {
    private readonly ddURL: string;
    private readonly service: string;

    constructor(ddURL: string, service: string) {
        this.ddURL = ddURL;
        this.service = service;
    }

    record(span: FoxxSpan): void {
        const tags = span.tags();
        const record: SpanRecord = {
            duration: Math.floor(span.durationS() * 1e9),
            name: span.operationName(),
            resource: tags.path || span.operationName(),
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

        record.metrics = {};
        const logs = Object.assign({}, ...span.logs());

        for (const key in logs) {
            record.metrics[key] = parseFloat(logs[key]);
        }

        // noinspection JSIgnoredPromiseFromCall
        tasks.register({
            command: function (params) {
                const request = require('@arangodb/request');
                const { record, url } = params;

                const response = request.put(url, {
                    json: true,
                    body: [[record]],
                    headers: {
                        "X-Datadog-Trace-Count": 1
                    }
                });

                console.log(response);
            },
            params: { record, url: this.ddURL }
        });
    }
}