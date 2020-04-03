import FoxxSpan from "../FoxxSpan";

export default interface Reporter {
    report(traces: [[FoxxSpan]]): void;
}