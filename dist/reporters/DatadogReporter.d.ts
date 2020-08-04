import Reporter from './Reporter';
import SpanData from '../helpers/SpanData';
export default class DatadogReporter implements Reporter {
    private readonly ddURL;
    constructor(ddURL: string);
    report(traces: SpanData[][]): void;
}
//# sourceMappingURL=DatadogReporter.d.ts.map