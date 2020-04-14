"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class FoxxReporter {
    report(traces) {
        const spans = traces.flat();
        console.debug(spans);
        module.context.dependencies.traceCollector.recordSpans(spans);
    }
}
exports.default = FoxxReporter;
//# sourceMappingURL=FoxxReporter.js.map