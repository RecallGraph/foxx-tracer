import Reporter from "./Reporter";
import SpanData from '../SpanData';

export default class ConsoleReporter implements Reporter {
    report(traces: [[SpanData]]): void {
        console.log('%O', traces);
    }
}