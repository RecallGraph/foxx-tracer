import * as opentracing from 'opentracing';
import FoxxSpan from './foxx_span';

/**
 * OpenTracing Context implementation designed for use in
 * unit tests.
 */
export class FoxxContext extends opentracing.SpanContext {

    //------------------------------------------------------------------------//
    // FoxxContext-specific
    //------------------------------------------------------------------------//

    private _span: FoxxSpan;

    constructor(span: FoxxSpan) {
        super();
        // Store a reference to the span itself since this is a foxx tracer
        // intended to make debugging and unit testing easier.
        this._span = span;
    }

    span(): FoxxSpan {
        return this._span;
    }
}

export default FoxxContext;
