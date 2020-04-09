"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class FoxxReporter {
    constructor() {
        this.recordSpans = module.context.dependencies.traceCollector.recordSpans;
    }
    report(traces) {
        try {
            this.recordSpans(traces.flat());
        }
        catch (e) {
            console.error(e);
        }
    }
}
exports.default = FoxxReporter;
//# sourceMappingURL=FoxxReporter.js.map