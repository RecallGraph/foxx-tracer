import {SpanContext, SpanOptions, Tracer} from "opentracing";
import FoxxContext from './foxx_context';
import FoxxReport from './foxx_report';
import FoxxSpan from './foxx_span';

export class FoxxTracer extends Tracer {
    private _spans: FoxxSpan[];
    private _currentContext: SpanContext;

    /**
     * Return the buffered data in a format convenient for making unit test
     * assertions.
     */
    report(): FoxxReport {
        return new FoxxReport(this._spans);
    }

    protected _extract(format: any, carrier: any): SpanContext {
        throw new Error('NOT YET IMPLEMENTED');
    }

    //------------------------------------------------------------------------//
    // FoxxTracer-specific
    //------------------------------------------------------------------------//

    constructor() {
        super();
        this._spans = [];
    }

    protected _inject(span: FoxxContext, format: any, carrier: any): never {
        throw new Error('NOT YET IMPLEMENTED');
    }

    /**
     * Discard any buffered data.
     */
    clear(): void {
        this._spans = [];
    }

    private _allocSpan(): FoxxSpan {
        return new FoxxSpan(this);
    }

    get currentContext(): SpanContext {
        return this._currentContext;
    }

    set currentContext(value: SpanContext) {
        this._currentContext = value;
    }

    protected _startSpan(name: string, fields: SpanOptions): FoxxSpan {
        const span = this._allocSpan();
        span.setOperationName(name);
        this._spans.push(span);

        if (fields.references) {
            for (const ref of fields.references) {
                span.addReference(ref);
            }
        }
        if (fields.tags) {
            for (const tagKey in fields.tags) {
                span.setTag(tagKey, fields.tags[tagKey])
            }
        }

        // Capture the stack at the time the span started
        span._startStack = new Error().stack;

        this._currentContext = span.context();

        return span;
    }
}

export default FoxxTracer;
