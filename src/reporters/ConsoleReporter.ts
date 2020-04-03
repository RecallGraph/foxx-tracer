import Reporter from "./Reporter";
import FoxxSpan from "../FoxxSpan";

export default class ConsoleReporter implements Reporter {
    report(traces: [[FoxxSpan]]): void {
        traces.forEach(trace => trace.forEach(span => console.log(span.debug())));
    }
}