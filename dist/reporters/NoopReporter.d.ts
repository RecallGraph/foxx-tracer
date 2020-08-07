import SpanData from "../helpers/SpanData";
import Reporter from "./Reporter";
export default class NoopReporter extends Reporter {
    constructor(namespace?: string);
    report(traces: SpanData[][]): void;
}
//# sourceMappingURL=NoopReporter.d.ts.map