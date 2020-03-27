'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
const opentracing = require('opentracing');
const foxx_report_1 = require('./foxx_report');
const foxx_span_1 = require('./foxx_span');

class FoxxTracer extends opentracing.Tracer {
  //------------------------------------------------------------------------//
  // FoxxTracer-specific
  //------------------------------------------------------------------------//
  constructor() {
    super();
    this._spans = [];
  }

  /**
   * Return the buffered data in a format convenient for making unit test
   * assertions.
   */
  report() {
    return new foxx_report_1.default(this._spans);
  }

  _startSpan(name, fields) {
    // _allocSpan is given it's own method so that derived classes can
    // allocate any type of object they want, but not have to duplicate
    // the other common logic in startSpan().
    const span = this._allocSpan();
    span.setOperationName(name);
    this._spans.push(span);
    if (fields.references) {
      for (const ref of fields.references) {
        span.addReference(ref);
      }
    }
    // Capture the stack at the time the span started
    span._startStack = new Error().stack;
    return span;
  }

  _extract(format, carrier) {
    throw new Error('NOT YET IMPLEMENTED');
  }

  _inject(span, format, carrier) {
    throw new Error('NOT YET IMPLEMENTED');
  }

  /**
   * Discard any buffered data.
   */
  clear() {
    this._spans = [];
  }

  _allocSpan() {
    return new foxx_span_1.default(this);
  }
}

exports.FoxxTracer = FoxxTracer;
exports.default = FoxxTracer;
//# sourceMappingURL=foxx_tracer.js.map