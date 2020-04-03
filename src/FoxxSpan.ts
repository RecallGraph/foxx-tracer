import { Reference, REFERENCE_CHILD_OF, Span } from 'opentracing';
import FoxxContext from './FoxxContext';
import FoxxTracer from './FoxxTracer';
import SpanContext from "opentracing/lib/span_context";
import { time } from "@arangodb";

interface Log {
    fields: { [key: string]: any };
    timestamp?: number;
}

export interface DebugInfo {
    traceId: string;
    spanId: string;
    parentId?: string;
    operation: string;
    millis: [number, number, number];
    tags?: { [key: string]: any };
    logs?: Log[];
}

/**
 * OpenTracing Span implementation designed for use in unit tests.
 */
export class FoxxSpan extends Span {
    private _operationName: string;
    private readonly _tags: { [key: string]: any };
    private readonly _logs: Log[];
    private readonly _refs: Reference[];
    _finishS: number;
    private readonly _foxxTracer: FoxxTracer;
    private readonly _uuid: string;
    private readonly _startS: number;
    private _foxxContext: FoxxContext;

    //------------------------------------------------------------------------//
    // OpenTracing implementation
    //------------------------------------------------------------------------//

    constructor(tracer: FoxxTracer) {
        super();
        this._foxxTracer = tracer;
        this._uuid = FoxxSpan.generateUUID();
        this._startS = time();
        this._finishS = 0;
        this._operationName = '';
        this._tags = {};
        this._logs = [];
        this._refs = [];
    }

    static generateUUID(): string {
        const p0 = `00000000${Math.abs((Math.random() * 0xFFFFFFFF) | 0).toString(16)}`.substr(-8);
        const p1 = `00000000${Math.abs((Math.random() * 0xFFFFFFFF) | 0).toString(16)}`.substr(-8);

        return `${p0}${p1}`;
    }

    get startS(): number {
        return this._startS;
    }

    protected _setOperationName(name: string): void {
        this._operationName = name;
    }

    protected _addTags(set: { [key: string]: any }): void {
        const keys = Object.keys(set);
        for (const key of keys) {
            this._tags[key] = set[key];
        }
    }

    logs(): Log[] {
        return this._logs;
    }

    initContext() {
        const parent = this.getParent();
        const traceId = parent ? parent.toTraceId() : FoxxSpan.generateUUID();

        this._foxxContext = new FoxxContext(traceId, this._uuid);
    }

    getParent(): SpanContext {
        const parent = this._refs.find(ref => ref.type() === REFERENCE_CHILD_OF);

        return parent ? parent.referencedContext() : null;
    }

    uuid(): string {
        return this._uuid;
    }

    operationName(): string {
        return this._operationName;
    }

    durationS(): number {
        return this._finishS - this._startS;
    }

    tags(): { [key: string]: any } {
        return this._tags;
    }

    protected _log(fields: { [key: string]: any }, timestamp?: number): void {
        this._logs.push({
            fields,
            timestamp: timestamp || Date.now()
        });
    }

    addReference(ref: Reference): void {
        this._refs.push(ref);
    }

    /**
     * Returns a simplified object better for console.log()'ing.
     */
    debug(): DebugInfo {
        const obj: DebugInfo = {
            traceId: this._foxxContext.toTraceId(),
            spanId: this._uuid,
            operation: this._operationName,
            millis: [this._finishS - this._startS, this._startS, this._finishS]
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

    protected _context(): SpanContext {
        return this._foxxContext;
    }

    protected _finish(finishTime?: number): void {
        this._finishS = finishTime || time();
    }
}

export default FoxxSpan;
