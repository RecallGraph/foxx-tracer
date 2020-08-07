"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Reporter_1 = require("./Reporter");
class NoopReporter extends Reporter_1.default {
    constructor(namespace = 'noop') {
        super(namespace);
    }
    report(traces) {
    }
}
exports.default = NoopReporter;
//# sourceMappingURL=NoopReporter.js.map