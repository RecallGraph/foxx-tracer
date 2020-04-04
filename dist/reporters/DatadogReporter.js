'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
const opentracing_1 = require('opentracing')
const request = require('@arangodb/request')

class DatadogReporter {
  constructor (ddURL, service) {
    this.ddURL = ddURL
    this.service = service
  }

  report (traces) {
    const ddTraces = traces.map(trace => trace.map(span => {
      const record = {
        duration: Math.floor((span.finishTimeMs - span.startTimeMs) * 1e6),
        name: span.operation,
        resource: span.operation,
        service: this.service,
        span_id: parseInt(span.context.span_id, 16),
        start: Math.floor(span.startTimeMs * 1e6),
        trace_id: parseInt(span.context.trace_id, 16),
        type: 'db'
      }
      const parent = span.references.find(ref => ref.type === opentracing_1.REFERENCE_CHILD_OF)
      if (parent) {
        record.parent_id = parseInt(parent.context.span_id, 16)
      }
      const hasError = span.tags[opentracing_1.Tags.ERROR]
      if (hasError) {
        record.error = 1
      }
      record.meta = {}
      for (const key in span.tags) {
        if (span.tags.hasOwnProperty(key)) {
          record.meta[key] = JSON.stringify(span.tags[key])
        }
      }
      record.metrics = {}
      const logs = Object.assign({}, ...span.logs.map(log => log.fields))
      for (const key in logs) {
        if (logs.hasOwnProperty(key)) {
          record.metrics[key] = parseFloat(logs[key])
        }
      }
      return record
    }))
    console.log(ddTraces)
    request.put(this.ddURL, {
      json: true,
      body: ddTraces,
      headers: {
        'X-Datadog-Trace-Count': `${ddTraces.length}`
      }
    })
  }
}

exports.default = DatadogReporter
//# sourceMappingURL=DatadogReporter.js.map