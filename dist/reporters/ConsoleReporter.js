"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const util_1 = require("util");
class ConsoleReporter {
    report(traces) {
        console.log(util_1.inspect(traces, ConsoleReporter.FORMAT_OPTIONS));
    }
}
exports.default = ConsoleReporter;
ConsoleReporter.FORMAT_OPTIONS = {
    depth: Infinity,
    maxArrayLength: Infinity,
    breakLength: Infinity,
    compact: true,
    sorted: true
};
//# sourceMappingURL=ConsoleReporter.js.map