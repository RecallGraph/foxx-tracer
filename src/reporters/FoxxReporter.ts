import Reporter from './Reporter';
import SpanData from '../helpers/SpanData';

const { recordSpans } = module.context.dependencies.traceCollector;

export default class FoxxReporter implements Reporter {
    report(traces: [[SpanData]]): void {
        try {
            recordSpans(traces.flat());
        } catch (e) {
            console.error(e);
        }
    }
}