"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Reporter_1 = require("./Reporter");
class FoxxReporter extends Reporter_1.default {
    constructor(namespace = 'foxx') {
        super(namespace);
    }
    report(traces) {
        const collector = module.context.configuration[this.config.collector] || 'traceCollector';
        try {
            module.context.dependencies[collector].recordSpans(traces.flat());
        }
        catch (e) {
            console.error(e.message, e.stack);
        }
    }
}
exports.default = FoxxReporter;
//# sourceMappingURL=FoxxReporter.js.map