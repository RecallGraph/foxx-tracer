import { SpanContext, SpanOptions, Tracer } from "opentracing";
import FoxxContext from './foxx_context';
import FoxxSpan from './foxx_span';
import Reporter from "./reporters/Reporter";

export class FoxxTracer extends Tracer {
    private _currentContext: SpanContext;
    private readonly _reporter: Reporter;

    protected _extract(format: any, carrier: any): SpanContext {
        throw new Error('NOT YET IMPLEMENTED');
    }

    constructor(recorder: Reporter) {
        super();

        this._reporter = recorder
    }

    get reporter(): Reporter {
        return this._reporter;
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
