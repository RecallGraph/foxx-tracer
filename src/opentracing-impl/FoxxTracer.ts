import { FORMAT_HTTP_HEADERS, FORMAT_TEXT_MAP, Span, SpanContext, SpanOptions, Tracer } from "opentracing";
import Reporter from "../reporters/Reporter";
import { TRACE_HEADER_KEYS, TraceHeaders } from "../helpers/utils";
import { Context, FoxxContext, FoxxSpan, SpanData } from "..";
import { isObjectLike } from 'lodash';

export abstract class ContextualTracer extends Tracer {
  abstract currentContext: SpanContext;

  abstract push(spanData: SpanData);

  abstract flush(traceId?: string);

  abstract currentTrace: string;
}

export class FoxxTracer extends ContextualTracer {
  private _finishedSpans: { [key: string]: SpanData[] };
  private _currentContext: SpanContext;
  private _currentTrace: string;

  private readonly _reporter: Reporter;

  private static isTraceHeaders(carrier: any): carrier is TraceHeaders {
    const c = carrier as TraceHeaders;
    const { TRACE_ID } = TRACE_HEADER_KEYS;

    return !!c[TRACE_ID];
  }

  private static isContext(carrier: any): carrier is Context {
    const c = carrier as Context;

    return !!c.span_id;
  }

  private static _allocSpan(): FoxxSpan {
    return new FoxxSpan();
  }

  constructor(reporter: Reporter) {
    super();

    this._reporter = reporter
  }

  get currentContext(): SpanContext {
    return this._currentContext;
  }

  set currentContext(value: SpanContext) {
    this._currentContext = value;
  }

  get currentTrace(): string {
    return this._currentTrace;
  }

  set currentTrace(value: string) {
    this._currentTrace = value;
  }

  get reporter(): Reporter {
    return this._reporter;
  }

  push(spanData: SpanData): void {
    const traceId = spanData.context.trace_id;

    if (!this._finishedSpans[traceId]) {
      this._finishedSpans[traceId] = [spanData];
    } else {
      this._finishedSpans[traceId].push(spanData);
    }
  }

  flush(traceId?: string) {
    if (traceId) {
      this._reporter.report([this._finishedSpans[traceId]]);
      delete this._finishedSpans[traceId];
    } else {
      this._reporter.report(Object.values(this._finishedSpans));
      this._finishedSpans = {};
    }
  }

  protected _extract(format: any, carrier: any): SpanContext {
    if ((format as string) === FORMAT_HTTP_HEADERS && FoxxTracer.isTraceHeaders(carrier)) {
      const c = carrier as TraceHeaders;
      const { PARENT_SPAN_ID, TRACE_ID, BAGGAGE } = TRACE_HEADER_KEYS;

      if (c[PARENT_SPAN_ID]) {
        const spanId = c[PARENT_SPAN_ID];
        const traceId = c[TRACE_ID];
        const baggage = c[BAGGAGE];

        return new FoxxContext(spanId, traceId, baggage);
      } else {
        return null;
      }
    } else if ((format as string) === FORMAT_TEXT_MAP && FoxxTracer.isContext(carrier)) {
      const c = carrier as Context;

      return new FoxxContext(c.span_id, c.trace_id, c.baggage);
    }

    return null;
  }

  protected _inject(span: FoxxContext, format: any, carrier: any): void {
    if ((format as string) === FORMAT_TEXT_MAP && isObjectLike(carrier)) {
      const c = carrier as Context;

      c.span_id = span.toSpanId();
      c.trace_id = span.toTraceId();
      c.baggage = span.baggage();
    }
  }

  protected _startSpan(name: string, fields: SpanOptions): Span {
    const span = FoxxTracer._allocSpan();
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

    span.initContext(this._currentTrace);

    return span;
  }
}

export default FoxxTracer;
