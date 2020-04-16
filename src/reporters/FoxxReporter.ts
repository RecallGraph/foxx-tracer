import Reporter from './Reporter';
import SpanData from '../helpers/SpanData';

export default class FoxxReporter implements Reporter {
  report(traces: SpanData[][]): void {
    try {
      module.context.dependencies.traceCollector.recordSpans(traces.flat());
    } catch (e) {
      console.error(e.message, e.stack)
    }
  }
}