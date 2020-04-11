import Request = Foxx.Request;
import Response = Foxx.Response;
import NextFunction = Foxx.NextFunction;
import {
    attachSpan,
    getTraceDirectiveFromHeaders,
    parseTraceHeaders,
    setTraceContext,
    TRACE_HEADER_KEYS
} from "./utils";
import { HTTP_METHOD, HTTP_STATUS_CODE, SPAN_KIND } from "opentracing/lib/ext/tags";
import { FORMAT_HTTP_HEADERS, globalTracer } from "opentracing";
import { ContextualTracer } from "../opentracing-impl/FoxxTracer";

export default function trace(req: Request, res: Response, next: NextFunction) {
    const traceHeaders = parseTraceHeaders(req.headers)
    const doTrace = getTraceDirectiveFromHeaders(traceHeaders)
    const tracer = globalTracer() as ContextualTracer;
    const rootContext = tracer.extract(FORMAT_HTTP_HEADERS, traceHeaders)

    setTraceContext(traceHeaders[TRACE_HEADER_KEYS.TRACE_ID], rootContext);

    const options = {
        tags: {
            [HTTP_METHOD]: req.method,
            [SPAN_KIND]: 'server',
            path: req.path,
            pathParams: req.pathParams,
            queryParams: req.queryParams
        }
    }
    attachSpan(next, `api${req.path}`, true, options, doTrace,
        (result, span) => {
            span.setTag(HTTP_STATUS_CODE, res.statusCode);
            span.log({
                size: res.body.toString().length
            });
            span.finish();
        }, (err, span) => {
            span.setTag(HTTP_STATUS_CODE, res.statusCode);
            span.finish();

            throw err;
        })();
}