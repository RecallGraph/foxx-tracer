"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Reporter_1 = require("./Reporter");
/** @internal */
class FoxxReporter extends Reporter_1.default {
    constructor(namespace = 'foxx') {
        super(namespace);
        this.collector = module.context.configuration[this.config.collector] || 'traceCollector';
    }
    report(traces) {
        try {
            module.context.dependencies[this.collector].recordSpans(traces.flat());
        }
        catch (e) {
            console.error(e.message, e.stack);
        }
    }
}
exports.default = FoxxReporter;
//# sourceMappingURL=FoxxReporter.js.map