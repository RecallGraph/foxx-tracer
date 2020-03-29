import {Reference, REFERENCE_CHILD_OF, Span, Tracer} from 'opentracing';
import FoxxContext from './foxx_context';
import FoxxTracer from './foxx_tracer';
import SpanContext from "opentracing/lib/span_context";

interface Log {
    fields: { [key: string]: any };
    timestamp?: number;
}

export interface DebugInfo {
    uuid: string;
    operation: string;
    millis: [number, number, number];
    tags?: { [key: string]: any };
}

/**
 * OpenTracing Span implementation designed for use in unit tests.
 */
export class FoxxSpan extends Span {
    private _operationName: string;
    private readonly _tags: { [key: string]: any };
    private readonly _logs: Log[];
    private readonly _refs: Reference[];
    _finishMs: number;
    private readonly _foxxTracer: FoxxTracer;
    private readonly _uuid: string;
    private readonly _startMs: number;
    _startStack?: string;
    private readonly _foxxContext: FoxxContext;

    //------------------------------------------------------------------------//
    // OpenTracing implementation
    //------------------------------------------------------------------------//

    constructor(tracer: FoxxTracer) {
        super();
        this._foxxTracer = tracer;
        this._uuid = FoxxSpan._generateUUID();
        this._startMs = Date.now();
        this._finishMs = 0;
        this._operationName = '';
        this._tags = {};
        this._logs = [];
        this._refs = [];
        this._foxxContext = new FoxxContext(this);
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

    static _generateUUID(): string {
        const p0 = `00000000${Math.abs((Math.random() * 0xFFFFFFFF) | 0).toString(16)}`.substr(-8);
        const p1 = `00000000${Math.abs((Math.random() * 0xFFFFFFFF) | 0).toString(16)}`.substr(-8);

        return `${p0}${p1}`;
    }

    getParent(): SpanContext {
        const parent = this._refs.find(ref => ref.type() === REFERENCE_CHILD_OF);

        return parent ? parent.referencedContext() : null;
    }

    //------------------------------------------------------------------------//
    // FoxxSpan-specific
    //------------------------------------------------------------------------//

    tracer(): Tracer {
        return this._foxxTracer;
    }

    uuid(): string {
        return this._uuid;
    }

    operationName(): string {
        return this._operationName;
    }

    durationMs(): number {
        return this._finishMs - this._startMs;
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

    protected _finish(finishTime?: number): void {
        this._finishMs = finishTime || Date.now();
        this._foxxTracer.currentContext = this.getParent();
    }

    protected _context(): SpanContext {
        return this._foxxContext;
    }

    /**
     * Returns a simplified object better for console.log()'ing.
     */
    debug(): DebugInfo {
        const obj: DebugInfo = {
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

export default FoxxSpan;
