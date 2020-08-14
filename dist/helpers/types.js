"use strict";
/**
 * This module exports a number of interfaces for data types that are used internally as well as by the
 * collector and reporter plugins.
 *
 * **This module is re-exported as a top-level export.**
 *
 * @packageDocumentation
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.TRACE_HEADER_KEYS = void 0;
/**
 * The HTTP header keys that are used to control tracing behaviour and for setting trace context.
 */
var TRACE_HEADER_KEYS;
(function (TRACE_HEADER_KEYS) {
    /**
     * The trace ID under which to record all new spans. If unspecified, a new trace is started and is
     * assigned a randomly generated [[generateUUID | UUID]].
     *
     * Note that if a new trace is started by *foxx-tracer*, the subsequent root span's span ID will **not**
     * be same as the generated trace ID.
     */
    TRACE_HEADER_KEYS["TRACE_ID"] = "x-trace-id";
    /**
     * A span ID (belonging to an ongoing trace) under which to create the top level span of the traced request.
     * This header **must be accompanied** by a non-emtpy [[TRACE_HEADER_KEYS.TRACE_ID | TRACE_ID]] header.
     * All spans generated with the application will now have this span ID as an ancestor.
     */
    TRACE_HEADER_KEYS["PARENT_SPAN_ID"] = "x-parent-span-id";
    /**
     * A JSON object containing key-value pairs that will set as the
     * [baggage](https://opentracing.io/specification/#set-a-baggage-item) for all spans recorded for this
     * request.
     */
    TRACE_HEADER_KEYS["BAGGAGE"] = "x-baggage";
    /**
     * An optional boolean that control whether the decision to record a trace should be forced,
     * suppressed or be left to the application to decide. If `true` a sample is forced. If `false` no sample
     * is taken. If left blank, the application decides based on the `sampling-probability` configuration
     * parameter (TODO: Add link to param docs).
     */
    TRACE_HEADER_KEYS["FORCE_SAMPLE"] = "x-force-sample";
})(TRACE_HEADER_KEYS = exports.TRACE_HEADER_KEYS || (exports.TRACE_HEADER_KEYS = {}));
//# sourceMappingURL=types.js.map