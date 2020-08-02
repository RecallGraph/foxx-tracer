/**
 * This module exports a single middleware function that is attached to any
 * [endpoint](https://www.arangodb.com/docs/3.6/foxx-reference-routers-endpoints.html) for which traces are to
 * be recorded.
 *
 * **Usage:**
 * ```javascript
 * const { middleware } = require('foxx-tracer')
 * module.context.use(middleware)
 * ```
 * @packageDocumentation
 */

import Request = Foxx.Request;
import Response = Foxx.Response;
import NextFunction = Foxx.NextFunction;
import { attachSpan, clearTraceContext, parseTraceHeaders, setTrace } from "./utils";
import { HTTP_METHOD, HTTP_STATUS_CODE, SPAN_KIND } from "opentracing/lib/ext/tags";

/**
 * The middleware function that enables traces on endpoints to which it is attached.
 *
 * **Not meant to be explicitly invoked.**
 */
export default function trace(req: Request, res: Response, next: NextFunction) {
  const traceHeaders = parseTraceHeaders(req.headers)
  setTrace(traceHeaders);

  const options = {
    tags: {
      [HTTP_METHOD]: req.method,
      [SPAN_KIND]: 'server',
      path: req.path,
      pathParams: req.pathParams,
      queryParams: req.queryParams
    }
  }
  attachSpan(next, `api${req.path}`, options,
    (result, span) => {
      span.setTag(HTTP_STATUS_CODE, res.statusCode);
      span.log({
        size: res.body ? res.body.toString().length : 0
      });
      span.finish();
    }, (err, span) => {
      span.setTag(HTTP_STATUS_CODE, res.statusCode);
      span.finish();

      throw err;
    })();

  clearTraceContext();
}