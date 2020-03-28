import * as opentracing from 'opentracing';
import FoxxSpan from './foxx_span';
import FoxxTracer from "./foxx_tracer";

export class FoxxContext extends opentracing.SpanContext {

    //------------------------------------------------------------------------//
    // FoxxContext-specific
    //------------------------------------------------------------------------//

    private readonly _span: FoxxSpan;
    private readonly _tracer: FoxxTracer;

    constructor(span: FoxxSpan) {
        super();
        // Store a reference to the span itself since this is a foxx tracer
        // intended to make debugging and unit testing easier.
        this._span = span;
        this._tracer = <FoxxTracer>span.tracer();
    }

    span(): FoxxSpan {
        return this._span;
    }

    toTraceId(): string {
        return this._tracer.uuid();
    }

    toSpanId(): string {
        return this._span.uuid();
    }
}

export default FoxxContext;
