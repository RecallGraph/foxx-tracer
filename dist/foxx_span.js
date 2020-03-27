'use strict';
/* eslint-disable import/no-extraneous-dependencies */
Object.defineProperty(exports, '__esModule', { value: true });
const opentracing = require('opentracing');
const foxx_context_1 = require('./foxx_context');

/**
 * OpenTracing Span implementation designed for use in unit tests.
 */
class FoxxSpan extends opentracing.Span {
  //------------------------------------------------------------------------//
  // OpenTracing implementation
  //------------------------------------------------------------------------//
  constructor(tracer) {
    super();
    this._foxxTracer = tracer;
    this._uuid = FoxxSpan._generateUUID();
    this._startMs = Date.now();
    this._finishMs = 0;
    this._operationName = '';
    this._tags = {};
    this._logs = [];
  }

  static _generateUUID() {
    const p0 = `00000000${Math.abs((Math.random() * 0xFFFFFFFF) | 0).toString(16)}`.substr(-8);
    const p1 = `00000000${Math.abs((Math.random() * 0xFFFFFFFF) | 0).toString(16)}`.substr(-8);
    return `${p0}${p1}`;
  }

  _setOperationName(name) {
    this._operationName = name;
  }

  _addTags(set) {
    const keys = Object.keys(set);
    for (const key of keys) {
      this._tags[key] = set[key];
    }
  }

  _log(fields, timestamp) {
    this._logs.push({
      fields,
      timestamp
    });
  }

  //------------------------------------------------------------------------//
  // FoxxSpan-specific

  _finish(finishTime) {
    this._finishMs = finishTime || Date.now();
  }

  //------------------------------------------------------------------------//
  tracer() {
    return this._foxxTracer;
  }

  uuid() {
    return this._uuid;
  }

  operationName() {
    return this._operationName;
  }

  durationMs() {
    return this._finishMs - this._startMs;
  }

  tags() {
    return this._tags;
  }

  addReference(ref) {
  }

  _context() {
    return new foxx_context_1.default(this);
  }

  /**
   * Returns a simplified object better for console.log()'ing.
   */
  debug() {
    const obj = {
      uuid: this._uuid,
      operation: this._operationName,
      millis: [this._finishMs - this._startMs, this._startMs, this._finishMs]
    };
    if (Object.keys(this._tags).length) {
      obj.tags = this._tags;
    }
    return obj;
  }
}

exports.FoxxSpan = FoxxSpan;
exports.default = FoxxSpan;
//# sourceMappingURL=foxx_span.js.map