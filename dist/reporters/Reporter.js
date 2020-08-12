"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Reporter {
    constructor(namespace) {
        this._config = module.context.configuration[`reporters-${namespace}`] || {};
    }
    get config() {
        return this._config;
    }
}
exports.default = Reporter;
//# sourceMappingURL=Reporter.js.map