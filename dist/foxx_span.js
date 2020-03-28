'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
const opentracing_1 = require('opentracing');
const foxx_context_1 = require('./foxx_context');
const foxx_tracer_1 = require('./foxx_tracer');

/**
 * OpenTracing Span implementation designed for use in unit tests.
 */
class FoxxSpan extends opentracing_1.Span {
    //------------------------------------------------------------------------//
    // OpenTracing implementation
    //------------------------------------------------------------------------//
    constructor(tracer) {
        super();
        this._foxxTracer = tracer;
        this._uuid = foxx_tracer_1.default._generateUUID();
        this._startMs = Date.now();
        this._finishMs = 0;
        this._operationName = '';
        this._tags = {};
        this._logs = [];
        this._refs = [];
        this._foxxContext = new foxx_context_1.default(this);
    }
    _setOperationName(name) {
        this._operationName = name;
    }
    _addTags(set) {
        const keys = Object.keys(set);
        for (const key of keys) {
            this._tags[key] = set[key];
        }
    }
    logs() {
        return this._logs;
    }
    _finish(finishTime) {
        this._finishMs = finishTime || Date.now();
    }
    //------------------------------------------------------------------------//
    // FoxxSpan-specific
    //------------------------------------------------------------------------//
    tracer() {
        return this._foxxTracer;
    }
    uuid() {
        return this._uuid;
    }
    operationName() {
        return this._operationName;
    }
    durationMs() {
        return this._finishMs - this._startMs;
    }
    tags() {
        return this._tags;
    }

    _log(fields, timestamp) {
        this._logs.push({
            fields,
            timestamp: timestamp || Date.now()
        });
    }

    addReference(ref) {
        this._refs.push(ref);
    }

    getParent() {
        const parent = this._refs.find(ref => ref.type() === opentracing_1.REFERENCE_CHILD_OF);
        return parent ? parent.referencedContext() : null;
    }

    _context() {
        return this._foxxContext;
    }

    /**
     * Returns a simplified object better for console.log()'ing.
     */
    debug() {
        const obj = {
            uuid: this._uuid,
            operation: this._operationName,
            millis: [this._finishMs - this._startMs, this._startMs, this._finishMs]
        };
        if (Object.keys(this._tags).length) {
            obj.tags = this._tags;
        }
        return obj;
    }
}
exports.FoxxSpan = FoxxSpan;
exports.default = FoxxSpan;
//# sourceMappingURL=foxx_span.js.map