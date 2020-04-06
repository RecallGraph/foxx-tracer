"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const opentracing_1 = require("opentracing");
const _arangodb_1 = require("@arangodb");
const FoxxContext_1 = require("./FoxxContext");
class FoxxSpan extends opentracing_1.Span {
    constructor(tracer) {
        super();
        this._foxxTracer = tracer;
        this._refs = [];
        this._spanData = {
            context: {
                span_id: FoxxSpan.generateUUID()
            },
            finishTimeMs: 0,
            operation: '',
            startTimeMs: _arangodb_1.time() * 1000,
            tags: {},
            logs: [],
            references: []
        };
    }
    get spanData() {
        return this._spanData;
    }
    static generateUUID() {
        const p0 = `00000000${Math.abs((Math.random() * 0xFFFFFFFF) | 0).toString(16)}`.substr(-8);
        const p1 = `00000000${Math.abs((Math.random() * 0xFFFFFFFF) | 0).toString(16)}`.substr(-8);
        return `${p0}${p1}`;
    }
    initContext() {
        const parent = this.getParent();
        const traceId = parent ? parent.toTraceId() : FoxxSpan.generateUUID();
        this._foxxContext = new FoxxContext_1.default(traceId, this._spanData.context.span_id);
    }
    durationMs() {
        return this._spanData.finishTimeMs - this._spanData.startTimeMs;
    }
    addReference(ref) {
        this._refs.push(ref);
        this._spanData.references.push({
            context: {
                span_id: ref.referencedContext().toSpanId(),
                trace_id: ref.referencedContext().toTraceId()
            },
            type: ref.type()
        });
    }
    getParent() {
        const parent = this._refs.find(ref => ref.type() === opentracing_1.REFERENCE_CHILD_OF);
        return parent ? parent.referencedContext() : null;
    }
    _setOperationName(name) {
        this._spanData.operation = name;
    }
    _addTags(set) {
        const keys = Object.keys(set);
        for (const key of keys) {
            this._spanData.tags[key] = set[key];
        }
    }
    _log(fields, timestamp) {
        this._spanData.logs.push({
            fields,
            timestamp: timestamp || _arangodb_1.time() * 1000
        });
    }
    _context() {
        return this._foxxContext;
    }
    _finish(finishTime) {
        this._spanData.finishTimeMs = finishTime || _arangodb_1.time() * 1000;
    }
}
exports.FoxxSpan = FoxxSpan;
exports.default = FoxxSpan;
//# sourceMappingURL=FoxxSpan.js.map