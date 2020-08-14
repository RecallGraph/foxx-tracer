import { SpanData } from "../helpers/types";
import Reporter from "./Reporter";
/** @ignore */
export default class NoopReporter extends Reporter {
    constructor(namespace?: string);
    report(traces: SpanData[][]): void;
}
//# sourceMappingURL=NoopReporter.d.ts.map