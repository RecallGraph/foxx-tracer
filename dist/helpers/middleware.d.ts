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
/// <reference types="arangodb" />
import Request = Foxx.Request;
import Response = Foxx.Response;
import NextFunction = Foxx.NextFunction;
/**
 * The middleware function that enables traces on endpoints to which it is attached.
 *
 * **Not meant to be explicitly invoked.**
 *
 * @ignore
 */
export default function trace(req: Request, res: Response, next: NextFunction): void;
//# sourceMappingURL=middleware.d.ts.map