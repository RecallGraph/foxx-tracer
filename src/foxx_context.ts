import * as opentracing from 'opentracing';
import FoxxSpan from './foxx_span';

export class FoxxContext extends opentracing.SpanContext {

    //------------------------------------------------------------------------//
    // FoxxContext-specific
    //------------------------------------------------------------------------//

    private readonly _span: FoxxSpan;

    constructor(span: FoxxSpan) {
        super();
        // Store a reference to the span itself since this is a foxx tracer
        // intended to make debugging and unit testing easier.
        this._span = span;
    }

    span(): FoxxSpan {
        return this._span;
    }

    toTraceId(): string {
        return "";
    }

    toSpanId(): string {
        return "";
    }
}

export default FoxxContext;
