import Reporter from "./Reporter";
import SpanData from '../helpers/SpanData';
import { inspect } from 'util';

export default class ConsoleReporter implements Reporter {
  private static readonly FORMAT_OPTIONS = {
    depth: Infinity,
    maxArrayLength: Infinity,
    breakLength: Infinity,
    compact: true,
    sorted: true
  };

  report(traces: [[SpanData]]): void {
    console.log(inspect(traces, ConsoleReporter.FORMAT_OPTIONS));
  }
}