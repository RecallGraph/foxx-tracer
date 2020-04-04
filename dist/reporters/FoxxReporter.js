'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
const { recordSpans } = module.context.dependencies.traceCollector

class FoxxReporter {
    report (traces) {
        const spans = traces.flat(2)
        try {
            recordSpans(spans)
        }
        catch (e) {
            console.error(e)
        }
    }
}

exports.default = FoxxReporter
//# sourceMappingURL=FoxxReporter.js.map