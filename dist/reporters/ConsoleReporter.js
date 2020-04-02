'use strict'
Object.defineProperty(exports, '__esModule', { value: true })

class ConsoleReporter {
  report (traces) {
    traces.forEach(trace => trace.forEach(span => console.log(span.debug())))
  }
}

exports.default = ConsoleReporter
//# sourceMappingURL=ConsoleReporter.js.map