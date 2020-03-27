'use strict';
Object.defineProperty(exports, '__esModule', { value: true });

/**
 * Index a collection of reported FoxxSpans in a way that's easy to run unit
 * test assertions against.
 */
class FoxxReport {
  constructor(spans) {
    this.spans = spans;
    this.spansByUUID = {};
    this.spansByTag = {};
    this.debugSpans = [];
    this.unfinishedSpans = [];
    spans.forEach(span => {
      if (span._finishMs === 0) {
        this.unfinishedSpans.push(span);
      }
      this.spansByUUID[span.uuid()] = span;
      this.debugSpans.push(span.debug());
      const tags = span.tags();
      Object.keys(tags).forEach((key) => {
        const val = tags[key];
        this.spansByTag[key] = this.spansByTag[key] || {};
        this.spansByTag[key][val] = this.spansByTag[key][val] || [];
        this.spansByTag[key][val].push(span);
      });
    });
  }

  firstSpanWithTagValue(key, val) {
    const m = this.spansByTag[key];
    if (!m) {
      return null;
    }
    const n = m[val];
    if (!n) {
      return null;
    }
    return n[0];
  }
}

exports.FoxxReport = FoxxReport;
exports.default = FoxxReport;
//# sourceMappingURL=foxx_report.js.map