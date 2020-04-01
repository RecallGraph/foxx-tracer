import Recorder from "./Recorder";
import FoxxSpan from "../foxx_span";

export default class ConsoleRecorder implements Recorder {
    record(span: FoxxSpan): void {
        console.log(span.debug());
    }
}