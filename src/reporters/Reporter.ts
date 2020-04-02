import FoxxSpan from "../foxx_span";

export default interface Reporter {
    record(traces: [[FoxxSpan]]): void;
}