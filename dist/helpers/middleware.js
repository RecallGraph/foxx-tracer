"use strict";
/**
 * This module exports a single middleware function that is attached to any
 * [endpoint](https://www.arangodb.com/docs/3.6/foxx-reference-routers-endpoints.html) for which traces are to
 * be recorded.
 *
 * **This module is re-exported as a top-level export.**
 *
 * See the [quickstart](../index.html#quickstart) for a primer on how
 * to set up your application for tracing.
 * @packageDocumentation
 */
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("./utils");
const opentracing_1 = require("opentracing");
const lodash_1 = require("lodash");
/**
 * The middleware function that enables traces on endpoints to which it is attached.
 *
 * **Not meant to be explicitly invoked.**
 *
 * @ignore
 */
function trace(req, res, next) {
    const traceHeaders = utils_1.parseTraceHeaders(req.headers);
    utils_1.setTrace(traceHeaders);
    const options = {
        tags: lodash_1.pickBy({
            [opentracing_1.Tags.HTTP_METHOD]: req.method,
            [opentracing_1.Tags.SPAN_KIND]: 'server',
            path: req.path,
            pathParams: JSON.stringify(req.pathParams),
            queryParams: JSON.stringify(req.queryParams)
        })
    };
    utils_1.attachSpan(next, `api${req.path}`, options, (result, span) => {
        span.setTag(opentracing_1.Tags.HTTP_STATUS_CODE, res.statusCode);
        span.log({
            size: res.body ? res.body.toString().length : 0
        });
        span.finish();
    }, (err, span) => {
        span.setTag(opentracing_1.Tags.HTTP_STATUS_CODE, res.statusCode);
        span.finish();
        throw err;
    })();
    utils_1.clearTraceContext();
}
exports.default = trace;
//# sourceMappingURL=middleware.js.map