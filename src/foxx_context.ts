import * as opentracing from 'opentracing';
import FoxxSpan from './foxx_span';

export class FoxxContext extends opentracing.SpanContext {

    //------------------------------------------------------------------------//
    // FoxxContext-specific
    //------------------------------------------------------------------------//

    private readonly _traceId: string;
    private readonly _spanId: string;

    constructor(span: FoxxSpan) {
        super();

        this._spanId = span.uuid();

        const parent = span.getParent();
        this._traceId = parent ? parent.toTraceId() : span.uuid();
    }

    toTraceId(): string {
        return this._traceId;
    }

    toSpanId(): string {
        return this._spanId;
    }
}

export default FoxxContext;
