import Reporter from "./Reporter";
import SpanData from '../helpers/SpanData';
import { inspect } from 'util';

export default class ConsoleReporter implements Reporter {
  report(traces: [[SpanData]]): void {
    console.log(inspect(traces, {
      depth: Infinity,
      maxArrayLength: Infinity,
      breakLength: Infinity,
      compact: true,
      sorted: true
    }));
  }
}