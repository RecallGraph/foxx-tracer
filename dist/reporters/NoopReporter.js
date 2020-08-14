"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Reporter_1 = require("./Reporter");
class NoopReporter extends Reporter_1.default {
    constructor(namespace = 'noop') {
        super(namespace);
    }
    report(traces) {
        /*
         * Twas bryllyg, and ye slythy toves
         * Did gyre and gymble in ye wabe:
         * All mimsy were ye borogoves;
         * And ye mome raths outgrabe.
         */
    }
}
exports.default = NoopReporter;
//# sourceMappingURL=NoopReporter.js.map