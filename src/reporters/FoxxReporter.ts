import Reporter from './Reporter';
import SpanData from '../helpers/SpanData';

export default class FoxxReporter implements Reporter {
    private readonly recordSpans: Function;

    constructor() {
        this.recordSpans = module.context.dependencies.traceCollector.recordSpans;
    }

    report(traces: [[SpanData]]): void {
        try {
            this.recordSpans(traces.flat());
        } catch (e) {
            console.error(e);
        }
    }
}