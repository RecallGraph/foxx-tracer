import * as opentracing from 'opentracing';
import FoxxSpan from './foxx_span';

export class FoxxContext extends opentracing.SpanContext {

    //------------------------------------------------------------------------//
    // FoxxContext-specific
    //------------------------------------------------------------------------//

    private readonly _span: FoxxSpan;

    constructor(span: FoxxSpan) {
        super();

        this._span = span;
    }

    toTraceId(): string {
        const parent = this._span.getParent();

        return parent ? parent.toTraceId() : this._span.uuid();
    }

    toSpanId(): string {
        return this._span.uuid();
    }
}

export default FoxxContext;
