import {SpanContext, SpanOptions, Tracer} from "opentracing";
import FoxxContext from './foxx_context';
import FoxxSpan from './foxx_span';
import Recorder from "./recorders/Recorder";

export class FoxxTracer extends Tracer {
    private _currentContext: SpanContext;
    private readonly _recorder: Recorder;

    protected _extract(format: any, carrier: any): SpanContext {
        throw new Error('NOT YET IMPLEMENTED');
    }

    constructor(recorder: Recorder) {
        super();

        this._recorder = recorder
    }

    get recorder(): Recorder {
        return this._recorder;
    }

    protected _inject(span: FoxxContext, format: any, carrier: any): never {
        throw new Error('NOT YET IMPLEMENTED');
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

        span.initContext();
        this._currentContext = span.context();

        return span;
    }
}

export default FoxxTracer;
