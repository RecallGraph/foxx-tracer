import Reporter from "./Reporter";
import SpanData from '../helpers/SpanData';
import { formatWithOptions } from 'util';

export default class ConsoleReporter implements Reporter {
  report(traces: [[SpanData]]): void {
    console.log(formatWithOptions({
      depth: Infinity,
      maxArrayLength: Infinity,
      breakLength: Infinity,
      compact: true,
      sorted: true
    }, '%O', traces));
  }
}