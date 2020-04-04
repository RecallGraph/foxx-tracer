import Reporter from './Reporter';
import SpanData from '../SpanData';

const { recordSpans } = module.context.dependencies.traceCollector;

export default class FoxxReporter implements Reporter {
    report(traces: [[SpanData]]): void {
        const spans = traces.flat(2);

        try {
            recordSpans(spans);
        } catch (e) {
            console.error(e);
        }
    }
}