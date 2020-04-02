import Reporter from "./Reporter";
import FoxxSpan from "../foxx_span";

export default class ConsoleReporter implements Reporter {
    record(traces: [[FoxxSpan]]): void {
        traces.forEach(trace => trace.forEach(span => console.log(span.debug())));
    }
}