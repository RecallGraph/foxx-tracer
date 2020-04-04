'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
const { recordSpans } = module.context.dependencies.traceCollector

class FoxxReporter {
    report (traces) {
        try {
            recordSpans(traces.flat())
        }
        catch (e) {
            console.error(e)
        }
    }
}

exports.default = FoxxReporter
//# sourceMappingURL=FoxxReporter.js.map