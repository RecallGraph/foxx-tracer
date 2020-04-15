"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class FoxxReporter {
    report(traces) {
        try {
            module.context.dependencies.traceCollector.recordSpans(traces.flat());
        }
        catch (e) {
            console.error(e);
        }
    }
}
exports.default = FoxxReporter;
//# sourceMappingURL=FoxxReporter.js.map