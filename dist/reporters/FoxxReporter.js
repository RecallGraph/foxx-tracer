"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class FoxxReporter {
    report(traces) {
        module.context.dependencies.traceCollector.recordSpans(traces.flat());
    }
}
exports.default = FoxxReporter;
//# sourceMappingURL=FoxxReporter.js.map