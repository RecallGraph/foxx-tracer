# foxx-tracer
An [OpenTracing](https://opentracing.io/) library for [Foxx Microservices](https://www.arangodb.com/docs/stable/foxx.html).

```bash
# In your foxx application root
npm install --save @recallgraph/foxx-tracer
```

See https://recallgraph.github.io/foxx-tracer/ for the full API documentation. A quickstart guide is given below.

## Why foxx-tracer
Most tracing libraries in the _nodeverse_ are asynchronous, and so do not work in the synchronous V8 runtime that [ArangoDB uses](https://www.arangodb.com/docs/stable/foxx.html#compatibility-caveats) to run its Foxx services. _foxx-tracer_ bridges this gap by being a 100% synchronous, dedicated module built for the Foxx runtime.

As a result, it relies on a number of features only available in a Foxx environment. It also depends on a [companion collector service](https://github.com/RecallGraph/foxx-tracer-collector) which itself is a Foxx microservice. These dependencies make this module **incompatible with Node.js and browser-based runtimes**.

## Quickstart
### Instrument Your Code 
1. Add _foxx-tracer_ as a dependency of the service for which you want to enable tracing.
    ```bash
    npm install --save @recallgraph/foxx-tracer
    ```
1. In your service, before mounting any trace-enabled routes, you need to initialize the tracer, trace headers and middleware. This is best done in your service's startup script (usually `main.js`).
    ```javascript
    const { utils: { setEndpointTraceHeaders, initTracer }, middleware } = require('foxx-tracer')
   
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
1. To wrap a function in a new [span](https://opentracing-javascript.surge.sh/classes/span.html), use [`attachSpan`](https://recallgraph.github.io/foxx-tracer/modules/_helpers_utils_.html#attachspan).
    ```javascript
    const { utils: { attachSpan } } = require('foxx-tracer')
   
    attachSpan(function() {}, 'opName', {/* options */}, onSuccess /* optional */, onError /* optional */)
    ```
1. To instrument a [db query](https://www.arangodb.com/docs/stable/aql/invocation-with-arangosh.html#with-db_query) (with query stats collection and reporting), use [`instrumentedQuery`](https://recallgraph.github.io/foxx-tracer/modules/_helpers_utils_.html#instrumentedquery).
    ```javascript
     const { utils: { instrumentedQuery } } = require('foxx-tracer')
   
    const query = aql.query(/* query */)
    const cursor = instrumentedQuery(query, 'queryName', {/* options */})
    ```
1. To correctly propagate the current [span context](https://opentracing.io/specification/#spancontext) across [transaction](https://www.arangodb.com/docs/3.6/transactions-transaction-invocation.html) boundaries, use [`executeTransaction`](https://recallgraph.github.io/foxx-tracer/modules/_helpers_utils_.html#executetransaction).
    ```javascript
     const { utils: { executeTransaction } } = require('foxx-tracer')
   
    const result = executeTransaction({/* transaction specification */})
    ```
1. To correctly propagate the current [span context](https://opentracing.io/specification/#spancontext) across [task](https://www.arangodb.com/docs/3.6/appendix-java-script-modules-tasks.html) invocations, use [`executeTask`](https://recallgraph.github.io/foxx-tracer/modules/_helpers_utils_.html#executetask).
    ```javascript
     const { utils: { executeTask } } = require('foxx-tracer')
   
    executeTask({/* task options */})
    ```

### Runtime Setup
1. Install the [collector service](https://github.com/RecallGraph/foxx-tracer-collector) and follow its setup instructions. **Add any reporter plugins that you need.**
1. In your application's settings, there is a param named `sampling-probability`. You can set this to a value between 0 and 1 (both inclusive) to tell the tracer how often to record a trace for incoming requests. For example, if  `sampling-probability = 0.1`, then roughly 1 out of 10 requests will be traced.

    Regardless of this param's value, a trace can be **force-recorded or force-suppressed** using the [`x-force-sample`](https://recallgraph.github.io/foxx-tracer/enums/_helpers_types_.trace_header_keys.html#force_sample) header parameter. See [Recording Traces](#recording-traces) for details.
1. Finally, you need to [assign the collector dependency](https://www.arangodb.com/docs/stable/foxx-guides-dependencies.html#assigning-dependencies) so that *foxx-tracer* knows where to send the recorded traces. The `manifest.json` file should have a `dependencies` object containing the following:
    ```json
    {
        "dependencies": {
            "traceCollector": {
                "name": "@RecallGraph/foxx-tracer-collector",
                "version": "^0.0.5",
                "description": "Opentrace-compatible collector to send span records to.",
                "required": false,
                "multiple": false
            }
        }
    }
    ```
   **Optional:**
   If, for some reason, you cannot name your dependency as `traceCollector` (in the unlikely case that it clashes with another dependency key), you can rename it to any other valid manifest key. But then, additional configuration is required to tell the tracer where to find the collector. The `manifest.json` should now have an additonal setting in `configuration`, containing the following:
    ```json
    {
        "configuration": {
            "reporters-foxx": {
                "type": "json",
                "required": true,
                "default": {
                    "collector": "customCollectorDependencyKey"
                },
                "description": "Settings for the foxx reporter."
            }
        }
    }
    ```
### Recording Traces
For the endpoints to which the trace middleware was attached, there are 4 trace-specific headers available that can be used for the following:
1. Propagate a running trace from the client to your application.
1. Force the application to record or suppress a trace for the request, regardless of the `sampling-probability` setting.

See the [Trace Header documentation](https://recallgraph.github.io/foxx-tracer/enums/_helpers_types_.trace_header_keys.html) for details.

## Reference Implementation
To get a better idea of how to instrument your Foxx service using *foxx-tracer*, take a look at the source of the [RecallGraph](https://github.com/RecallGraph/RecallGraph) project.