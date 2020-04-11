"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("./utils");
const tags_1 = require("opentracing/lib/ext/tags");
const opentracing_1 = require("opentracing");
function trace(req, res, next) {
    const traceHeaders = utils_1.parseTraceHeaders(req.headers);
    const doTrace = utils_1.getTraceDirectiveFromHeaders(traceHeaders);
    const tracer = opentracing_1.globalTracer();
    const rootContext = tracer.extract(opentracing_1.FORMAT_HTTP_HEADERS, traceHeaders);
    utils_1.setTraceContext(traceHeaders[utils_1.TRACE_HEADER_KEYS.TRACE_ID], rootContext);
    const options = {
        tags: {
            [tags_1.HTTP_METHOD]: req.method,
            [tags_1.SPAN_KIND]: 'server',
            path: req.path,
            pathParams: req.pathParams,
            queryParams: req.queryParams
        }
    };
    utils_1.attachSpan(next, `api${req.path}`, true, options, doTrace, (result, span) => {
        span.setTag(tags_1.HTTP_STATUS_CODE, res.statusCode);
        span.log({
            size: res.body.toString().length
        });
        span.finish();
    }, (err, span) => {
        span.setTag(tags_1.HTTP_STATUS_CODE, res.statusCode);
        span.finish();
        throw err;
    })();
}
exports.default = trace;
//# sourceMappingURL=middleware.js.map