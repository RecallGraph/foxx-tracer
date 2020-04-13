"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class FoxxReporter {
    report(traces) {
        try {
            const spans = traces.flat();
            console.debug(spans);
            module.context.dependencies.traceCollector.recordSpans(spans);
        }
        catch (e) {
            console.error(`Collector endpoint error: ${e}`);
        }
    }
}
exports.default = FoxxReporter;
//# sourceMappingURL=FoxxReporter.js.map