import { Reference, Span, SpanContext } from 'opentracing';
import { time } from '@arangodb';
import FoxxContext from './FoxxContext';
import SpanData from '../helpers/SpanData';
import { getParent, reportSpan } from '../helpers/utils'

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

    initContext(traceId: string) {
        console.log(traceId);
        const parent = this.getParent();
        traceId = traceId || (parent ? parent.toTraceId() : FoxxSpan.generateUUID());

        this._foxxContext = new FoxxContext(this._spanData.context.span_id, traceId);
        this._spanData.context.trace_id = traceId;
    }

    addReference(ref: Reference): void {
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

    private getParent(): SpanContext {
        return getParent(this._refs);
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

    protected _setBaggageItem(key: string, value: string): void {
        this._spanData.context.baggage[key] = value;
    }

    protected _getBaggageItem(key: string): string | undefined {
        return this._spanData.context.baggage[key];
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
        reportSpan(this._spanData);
    }
}

export default FoxxSpan;
