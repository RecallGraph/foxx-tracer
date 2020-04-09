import { Reference, REFERENCE_CHILD_OF, Span, SpanContext } from 'opentracing';
import { time } from '@arangodb';
import FoxxContext from './FoxxContext';
import SpanData from '../helpers/SpanData';

export class FoxxSpan extends Span {
    private readonly _spanData: SpanData;
    private readonly _refs: Reference[];
    private _foxxContext: FoxxContext;

    constructor() {
        super();
        this._refs = [];
        this._spanData = {
            context: {
                span_id: FoxxSpan.generateUUID()
            },
            finishTimeMs: 0,
            operation: '',
            startTimeMs: time() * 1000,
            tags: {},
            logs: [],
            references: []
        };
    }

    get spanData(): SpanData {
        return this._spanData;
    }

    static generateUUID(): string {
        const p0 = `00000000${Math.abs((Math.random() * 0xFFFFFFFF) | 0).toString(16)}`.substr(-8);
        const p1 = `00000000${Math.abs((Math.random() * 0xFFFFFFFF) | 0).toString(16)}`.substr(-8);

        return `${p0}${p1}`;
    }

    initContext() {
        const parent = this.getParent();
        const traceId = parent ? parent.toTraceId() : FoxxSpan.generateUUID();

        this._foxxContext = new FoxxContext(traceId, this._spanData.context.span_id);
    }

    durationMs(): number {
        return this._spanData.finishTimeMs - this._spanData.startTimeMs;
    }

    addReference(ref: Reference): void {
        this._refs.push(ref);
        this._spanData.references.push({
            context: {
                span_id: ref.referencedContext().toSpanId(),
                trace_id: ref.referencedContext().toTraceId()
            },
            type: ref.type()
        });
    }

    getParent(): SpanContext {
        const parent = this._refs.find(ref => ref.type() === REFERENCE_CHILD_OF);

        return parent ? parent.referencedContext() : null;
    }

    protected _setOperationName(name: string): void {
        this._spanData.operation = name;
    }

    protected _addTags(set: { [key: string]: any }): void {
        const keys = Object.keys(set);
        for (const key of keys) {
            this._spanData.tags[key] = set[key];
        }
    }

    protected _log(fields: { [key: string]: any }, timestamp?: number): void {
        this._spanData.logs.push({
            fields,
            timestamp: timestamp || time() * 1000
        });
    }

    protected _context(): SpanContext {
        return this._foxxContext;
    }

    protected _finish(finishTime?: number): void {
        this._spanData.finishTimeMs = finishTime || time() * 1000;
    }
}

export default FoxxSpan;
