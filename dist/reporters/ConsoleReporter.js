"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const util_1 = require("util");
class ConsoleReporter {
    report(traces) {
        console.log(util_1.formatWithOptions({
            depth: Infinity,
            maxArrayLength: Infinity,
            breakLength: Infinity,
            compact: true,
            sorted: true
        }, '%O', traces));
    }
}
exports.default = ConsoleReporter;
//# sourceMappingURL=ConsoleReporter.js.map