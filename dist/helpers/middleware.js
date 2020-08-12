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
const tags_1 = require("opentracing/lib/ext/tags");
const lodash_1 = require("lodash");
/**
 * The middleware function that enables traces on endpoints to which it is attached.
 *
 * **Not meant to be explicitly invoked.**
 */
function trace(req, res, next) {
    const traceHeaders = utils_1.parseTraceHeaders(req.headers);
    utils_1.setTrace(traceHeaders);
    const options = {
        tags: lodash_1.pickBy({
            [tags_1.HTTP_METHOD]: req.method,
            [tags_1.SPAN_KIND]: 'server',
            path: req.path,
            pathParams: req.pathParams,
            queryParams: req.queryParams
        })
    };
    utils_1.attachSpan(next, `api${req.path}`, options, (result, span) => {
        span.setTag(tags_1.HTTP_STATUS_CODE, res.statusCode);
        span.log({
            size: res.body ? res.body.toString().length : 0
        });
        span.finish();
    }, (err, span) => {
        span.setTag(tags_1.HTTP_STATUS_CODE, res.statusCode);
        span.finish();
        throw err;
    })();
    utils_1.clearTraceContext();
}
exports.default = trace;
//# sourceMappingURL=middleware.js.map