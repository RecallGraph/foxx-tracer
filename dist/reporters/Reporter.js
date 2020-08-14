"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * The base class for all *reporters*. A subclass of this class can act as a reporter for the
 * [foxx-tracer-collector](https://github.com/RecallGraph/foxx-tracer-collector) service.
 *
 * A special implementation is used internally by *foxx-tracer* to report recorded spans to the collector.
 */
class Reporter {
    /**
     * The base constructor that sets a pointer to the reporter implementation's namespaced configuration.
     *
     * @param namespace A key used to uniquely identify a reporter implementation to the collector's list
     * of registered reporters and also to locate its configuration in the collector's `manifest.json`. See
     * [collector docs](https://github.com/RecallGraph/foxx-tracer-collector) for more information on
     * namespaces.
     */
    constructor(namespace) {
        this._config = module.context.configuration[`reporters-${namespace}`] || {};
    }
    /**
     * Returns the configuration object present in `manifest.json`, or a blank object. The configuration
     * object to pick is identified by the `namespace` param passed to the reporter's contructor.
     */
    get config() {
        return this._config;
    }
}
exports.default = Reporter;
//# sourceMappingURL=Reporter.js.map