'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
const opentracing_1 = require('opentracing')

class FoxxContext extends opentracing_1.SpanContext {
  constructor (traceId, spanId) {
    super()
    this.context = {
      span_id: spanId,
      trace_id: traceId,
      baggage: {}
    }
  }

  toTraceId () {
    return this.context.trace_id
  }

  toSpanId () {
    return this.context.span_id
  }

  baggage () {
    return this.context.baggage
  }
}

exports.FoxxContext = FoxxContext
exports.default = FoxxContext
//# sourceMappingURL=FoxxContext.js.map