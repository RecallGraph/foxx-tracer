# foxx-tracer
An [OpenTracing](https://opentracing.io/) library for [Foxx Microservices](https://www.arangodb.com/docs/stable/foxx.html).

```bash
# In your foxx application root
npm install --save @recallgraph/foxx-tracer
```

See https://recallgraph.github.io/foxx-tracer/ for the full API documentation. A quickstart guide is [given below](#quickstart).

## Why foxx-tracer
Most tracing libraries in the _nodeverse_ are asynchronous, meaning they do not work in the synchronous V8 runtime that [ArangoDB uses](https://www.arangodb.com/docs/stable/foxx.html#compatibility-caveats) to run its Foxx services. _foxx-tracer_ bridges this gap by being a 100% synchronous, dedicated module built for the Foxx runtime.

However, as a consequence, it relies on a number of features only available in a Foxx environment. It also depends on a [companion collector service](https://github.com/RecallGraph/foxx-tracer-collector) which itself is a Foxx microservice. These dependencies make this module **incompatible with Node.js and browser-based runtimes**, despite being delivered as an _npm_ package.

## Quickstart
1. Add _foxx-tracer_ as a dependency of the service for which you want to enable tracing.
    ```bash
    npm install --save @recallgraph/foxx-tracer
    ```
1. Install the [collector service](https://github.com/RecallGraph/foxx-tracer-collector) and follow its setup instructions.
1. In your service, before mounting any trace-enabled routes, you need to initialize the tracer, trace headers and middleware. This is best done in your service's startup module (usually `main.js`).
    ```javascript
    const { utils: { setEndpointTraceHeaders, initTracer }, middleware } = require('foxx-tracing')
   
    // Initialize the tracer
    initTracer()
   
    // Use the tracing middleware for all endpoints.
    // You may also do this selectively for only those endpoints that you want to trace.
    module.context.use(middleware)
   
    // Create a router.
    const router = createRouter()
    /*
       Create a request handler endpoint using one of the router's several instance methods:
       const endpoint = router.[get|post|put|patch|delete|all|use](...)
    */
   
    // Attach trace headers to the endpoint
    setEndpointTraceHeaders(endpoint)
    ```