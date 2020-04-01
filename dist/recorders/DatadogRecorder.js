'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
const tags_1 = require('opentracing/lib/ext/tags');
const tasks = require('@arangodb/tasks');

class DatadogRecorder {
    constructor(ddURL, service) {
        this.ddURL = ddURL;
        this.service = service;
    }

    record(span) {
        const tags = span.tags();
        const record = {
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
        const hasError = tags[tags_1.ERROR];
        if (hasError) {
            record.error = 1;
        }
        record.meta = {};
        for (const key in tags) {
            record.meta[key] = JSON.stringify(tags[key]);
        }
        // record.metrics = {};
        // const logs = Object.assign({}, ...span.logs().map(log => log.fields));
        //
        // for (const key in logs) {
        //     record.metrics[key] = parseFloat(logs[key]);
        // }
        console.log(record);
        // noinspection JSIgnoredPromiseFromCall
        tasks.register({
            command: function (params) {
                const request = require('@arangodb/request');
                const { record, url } = params;
                request.put(url, {
                    json: true,
                    body: [[record]],
                    headers: {
                        'X-Datadog-Trace-Count': 1
                    }
                });
            },
            params: { record, url: this.ddURL }
        });
    }
}
exports.default = DatadogRecorder;
//# sourceMappingURL=DatadogRecorder.js.map