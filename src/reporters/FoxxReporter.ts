import Reporter from './Reporter';
import SpanData from '../helpers/SpanData';

const tasks = require('@arangodb/tasks');

export default class FoxxReporter implements Reporter {
  report(traces: [[SpanData]]): void {
    const spans = traces.flat();
    console.debug(spans);

    // noinspection TypeScriptValidateJSTypes
    const task = tasks.register({
      command: function (spans) {
        try {
          module.context.dependencies.traceCollector.recordSpans(spans);
        } catch (e) {
          console.error(`Collector endpoint error: ${e}`);
        }
      },
      params: spans
    });
    console.debug(task);
  }
}