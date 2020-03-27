/* eslint-disable import/no-extraneous-dependencies */

import * as opentracing from 'opentracing';
import FoxxContext from './foxx_context';
import FoxxTracer from './foxx_tracer';

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
export class FoxxSpan extends opentracing.Span {

    private _operationName: string;
    private readonly _tags: { [key: string]: any };
    private _logs: Log[];
    _finishMs: number;
    private readonly _foxxTracer: FoxxTracer;
    private readonly _uuid: string;
    private readonly _startMs: number;
    _startStack?: string;

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

    protected _log(fields: { [key: string]: any }, timestamp?: number): void {
        this._logs.push({
            fields,
            timestamp
        });
    }

    protected _finish(finishTime?: number): void {
        this._finishMs = finishTime || Date.now();
    }

    //------------------------------------------------------------------------//
    // FoxxSpan-specific
    //------------------------------------------------------------------------//

    tracer(): opentracing.Tracer {
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

    addReference(ref: opentracing.Reference): void {
    }

    private static _generateUUID(): string {
        const p0 = `00000000${Math.abs((Math.random() * 0xFFFFFFFF) | 0).toString(16)}`.substr(-8);
        const p1 = `00000000${Math.abs((Math.random() * 0xFFFFFFFF) | 0).toString(16)}`.substr(-8);

        return `${p0}${p1}`;
    }

    protected _context(): FoxxContext {
        return new FoxxContext(this);
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
