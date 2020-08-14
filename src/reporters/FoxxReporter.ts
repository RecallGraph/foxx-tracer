import Reporter from './Reporter';
import SpanData from '../helpers/SpanData';

export default class FoxxReporter extends Reporter {
  private readonly collector: string;

  constructor(namespace: string = 'foxx') {
    super(namespace);

    this.collector = module.context.configuration[this.config.collector] || 'traceCollector';
  }

  report(traces: SpanData[][]): void {
    try {
      module.context.dependencies[this.collector].recordSpans(traces.flat());
    } catch (e) {
      console.error(e.message, e.stack)
    }
  }
}