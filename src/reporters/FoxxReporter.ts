import Reporter from './Reporter';
import SpanData from '../helpers/SpanData';

export default class FoxxReporter extends Reporter {
  constructor(namespace: string = 'foxx') {
    super(namespace);
  }

  report(traces: SpanData[][]): void {
    const collector = module.context.configuration[this.config.collector] || 'traceCollector';
    try {
      module.context.dependencies[collector].recordSpans(traces.flat());
    } catch (e) {
      console.error(e.message, e.stack)
    }
  }
}