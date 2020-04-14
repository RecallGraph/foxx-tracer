import Request = Foxx.Request;
import Response = Foxx.Response;
import NextFunction = Foxx.NextFunction;
import { attachSpan, clearTraceContext, parseTraceHeaders, setTrace } from "./utils";
import { HTTP_METHOD, HTTP_STATUS_CODE, SPAN_KIND } from "opentracing/lib/ext/tags";

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
        size: res.body.toString().length
      });
      span.finish();
    }, (err, span) => {
      span.setTag(HTTP_STATUS_CODE, res.statusCode);
      span.finish();

      throw err;
    })();

  clearTraceContext();
}