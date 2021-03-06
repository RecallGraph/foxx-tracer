"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const opentracing_1 = require("opentracing");
const _arangodb_1 = require("@arangodb");
const FoxxContext_1 = require("./FoxxContext");
const utils_1 = require("../helpers/utils");
/** @internal */
class FoxxSpan extends opentracing_1.Span {
    constructor() {
        super();
        this._refs = [];
        this._spanData = {
            context: {
                span_id: utils_1.generateUUID()
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
    initContext(traceId) {
        const parent = this.getParent();
        traceId = traceId || (parent ? parent.toTraceId() : utils_1.generateUUID());
        this._foxxContext = new FoxxContext_1.default(this._spanData.context.span_id, traceId);
        this._spanData.context.trace_id = traceId;
        utils_1.setTraceContext(traceId, this._foxxContext);
    }
    addReference(ref) {
        this._refs.push(ref);
        const refContext = ref.referencedContext();
        this._spanData.references.push({
            context: {
                span_id: refContext.toSpanId(),
                trace_id: refContext.toTraceId()
            },
            type: ref.type()
        });
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
    _setBaggageItem(key, value) {
        this._spanData.context.baggage[key] = value;
    }
    _getBaggageItem(key) {
        return this._spanData.context.baggage[key];
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
        utils_1.setTraceContext(this._spanData.context.trace_id, this.getParent());
        utils_1.reportSpan(this._spanData);
    }
    getParent() {
        return utils_1.getParent(this._refs);
    }
}
exports.default = FoxxSpan;
//# sourceMappingURL=FoxxSpan.js.map