import {SpanContext, SpanOptions, Tracer} from "opentracing";
import FoxxContext from './foxx_context';
import FoxxReport from './foxx_report';
import FoxxSpan from './foxx_span';

export class FoxxTracer extends Tracer {

    private _spans: FoxxSpan[];

    /**
     * Return the buffered data in a format convenient for making unit test
     * assertions.
     */
    report(): FoxxReport {
        return new FoxxReport(this._spans);
    }

    currentContext(): SpanContext {
        return this._spans[this._spans.length - 1].context()
    }

    protected _extract(format: any, carrier: any): SpanContext {
        if (carrier === this) {
            return this.currentContext();
        } else {
            throw new Error('NOT YET IMPLEMENTED');
        }
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

    protected _startSpan(name: string, fields: SpanOptions): FoxxSpan {
        // _allocSpan is given it's own method so that derived classes can
        // allocate any type of object they want, but not have to duplicate
        // the other common logic in startSpan().
        const span = this._allocSpan();
        span.setOperationName(name);
        this._spans.push(span);

        if (fields.references) {
            for (const ref of fields.references) {
                span.addReference(ref);
            }
        }

        // Capture the stack at the time the span started
        span._startStack = new Error().stack;
        return span;
    }
}

export default FoxxTracer;
