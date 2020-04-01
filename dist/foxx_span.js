"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const opentracing_1 = require("opentracing");
const foxx_context_1 = require("./foxx_context");
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
        this._uuid = FoxxSpan.generateUUID();
        this._startMs = Date.now();
        this._finishMs = 0;
        this._operationName = '';
        this._tags = {};
        this._logs = [];
        this._refs = [];
    }

    static generateUUID() {
        const p0 = `00000000${Math.abs((Math.random() * 0xFFFFFFFF) | 0).toString(16)}`.substr(-8);
        const p1 = `00000000${Math.abs((Math.random() * 0xFFFFFFFF) | 0).toString(16)}`.substr(-8);
        return `${p0}${p1}`;
    }

    get startMs() {
        return this._startMs;
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
    initContext() {
        const parent = this.getParent();
        const traceId = parent ? parent.toTraceId() : FoxxSpan.generateUUID();
        this._foxxContext = new foxx_context_1.default(traceId, this._uuid);
    }
    getParent() {
        const parent = this._refs.find(ref => ref.type() === opentracing_1.REFERENCE_CHILD_OF);
        return parent ? parent.referencedContext() : null;
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
    _finish(finishTime) {
        this._finishMs = finishTime || Date.now();
        this._foxxTracer.recorder.record(this);
    }
    _context() {
        return this._foxxContext;
    }
    /**
     * Returns a simplified object better for console.log()'ing.
     */
    debug() {
        const obj = {
            traceId: this._foxxContext.toTraceId(),
            spanId: this._uuid,
            operation: this._operationName,
            millis: [this._finishMs - this._startMs, this._startMs, this._finishMs]
        };
        const parent = this.getParent();
        if (parent) {
            obj.parentId = this.getParent().toSpanId();
        }
        if (Object.keys(this._tags).length) {
            obj.tags = this._tags;
        }
        if (this._logs.length) {
            obj.logs = this._logs;
        }
        return obj;
    }
}
exports.FoxxSpan = FoxxSpan;
exports.default = FoxxSpan;
//# sourceMappingURL=foxx_span.js.map