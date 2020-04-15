import Reporter from './Reporter';
import SpanData from '../helpers/SpanData';

export default class FoxxReporter implements Reporter {
  report(traces: SpanData[][]): void {
    module.context.dependencies.traceCollector.recordSpans(traces.flat());
  }
}