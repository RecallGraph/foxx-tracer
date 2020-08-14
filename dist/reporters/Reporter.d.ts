import { SpanData } from '../helpers/types';
/**
 * The base class for all *reporters*. A subclass of this class can act as a reporter for the
 * [foxx-tracer-collector](https://github.com/RecallGraph/foxx-tracer-collector) service.
 *
 * A special implementation is used internally by *foxx-tracer* to report recorded spans to the collector.
 */
export default abstract class Reporter {
    private readonly _config;
    /**
     * The base constructor that sets a pointer to the reporter implementation's namespaced configuration.
     *
     * @param namespace A key used to uniquely identify a reporter implementation to the collector's list
     * of registered reporters and also to locate its configuration in the collector's `manifest.json`. See
     * [collector docs](https://github.com/RecallGraph/foxx-tracer-collector) for more information on
     * namespaces.
     */
    protected constructor(namespace: string);
    /**
     * Returns the configuration object present in `manifest.json`, or a blank object. The configuration
     * object to pick is identified by the `namespace` param passed to the reporter's contructor.
     */
    protected get config(): {
        [key: string]: any;
    };
    /**
     * Reports the provided traces to the reporter's configured endpoint. This method **MUST** be
     * implemented by all concrete sub-classes. See the
     * [ConsoleReporter](https://github.com/RecallGraph/foxx-tracer-reporter-console/blob/master/src/ConsoleReporter.ts)
     * and the
     * [Datadog reporter](https://github.com/RecallGraph/foxx-tracer-reporter-datadog/blob/master/src/DatadogReporter.ts)
     * for reference implementations.
     *
     * @param traces An array of traces (each trace being an array of [[SpanData]]).
     */
    abstract report(traces: SpanData[][]): void;
}
//# sourceMappingURL=Reporter.d.ts.map