import FoxxSpan from "../foxx_span";

export default interface Reporter {
    report(traces: [[FoxxSpan]]): void;
}