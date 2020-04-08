import { FORMAT_HTTP_HEADERS, Span, SpanContext, SpanOptions, Tracer } from "opentracing";
import FoxxContext from './FoxxContext';
import FoxxSpan from './FoxxSpan';
import Reporter from "../reporters/Reporter";
import { TRACE_HEADER_KEYS, TraceHeaders } from "../helpers/Utils";
import { get, isNil } from 'lodash';

export class FoxxTracer extends Tracer {
    private _currentContext: SpanContext;
    private readonly _reporter: Reporter;
    private readonly noopTracer: Tracer = new Tracer();

    private static isHeader(carrier: any): carrier is TraceHeaders {
        const c = carrier as TraceHeaders;
        const { PARENT_SPAN_ID } = TRACE_HEADER_KEYS;

        return !!c[PARENT_SPAN_ID];
    }

    constructor(reporter: Reporter) {
        super();

        this._reporter = reporter
    }

    protected _extract(format: any, carrier: any): SpanContext {
        if ((format as string) === FORMAT_HTTP_HEADERS && FoxxTracer.isHeader(carrier)) {
            const c = carrier as TraceHeaders;
            const { PARENT_SPAN_ID, TRACE_ID, BAGGAGE } = TRACE_HEADER_KEYS;
            const spanId = c[PARENT_SPAN_ID];
            const traceId = c[TRACE_ID];
            const baggage = c[BAGGAGE];

            return new FoxxContext(spanId, traceId, baggage);
        }

        return null;
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

    protected _startSpan(name: string, fields: SpanOptions): Span {
        const { PARENT_SPAN_ID, FORCE_SAMPLE } = TRACE_HEADER_KEYS;
        const forceSample = get(fields, ['tags', FORCE_SAMPLE], get(fields, ['tags', PARENT_SPAN_ID]));
        let doTrace: boolean;
        if (isNil(forceSample)) {
            const samplingProbability = module.context.configuration['sampling-probability'];

            doTrace = Math.random() < samplingProbability;
        } else {
            doTrace = forceSample;
            delete fields.tags.forceSample;
        }

        let span: Span;
        if (doTrace) {
            span = this._allocSpan();
            span.setOperationName(name);

            if (fields.references) {
                for (const ref of fields.references) {
                    (span as FoxxSpan).addReference(ref);
                }
            }
            if (fields.tags) {
                for (const tagKey in fields.tags) {
                    span.setTag(tagKey, fields.tags[tagKey])
                }
            }

            (span as FoxxSpan).initContext();
            this._currentContext = span.context();
        } else {
            span = this.noopTracer.startSpan(name, fields);
        }


        return span;
    }
}

export default FoxxTracer;