import FoxxSpan from "../foxx_span";

export default interface Recorder {
    record(span: FoxxSpan): void;
}