import Reporter from './Reporter';
import SpanData from '../helpers/SpanData';

export default class FoxxReporter implements Reporter {
    report(traces: [[SpanData]]): void {
        try {
            const spans = traces.flat();
            console.debug(spans);

            module.context.dependencies.traceCollector.recordSpans(spans);
        } catch (e) {
            console.error(`Collector endpoint error: ${e}`);
        }
    }
}