"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tasks = require('@arangodb/tasks');
class FoxxReporter {
    report(traces) {
        const spans = traces.flat();
        console.debug(spans);
        // noinspection TypeScriptValidateJSTypes
        const task = tasks.register({
            command: function (spans) {
                try {
                    require('module').context.dependencies.traceCollector.recordSpans(spans);
                }
                catch (e) {
                    console.error(`Collector endpoint error: ${e}`);
                }
            },
            params: spans
        });
        console.debug(task);
    }
}
exports.default = FoxxReporter;
//# sourceMappingURL=FoxxReporter.js.map