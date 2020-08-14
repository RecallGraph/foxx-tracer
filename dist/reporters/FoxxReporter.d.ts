import Reporter from './Reporter';
import SpanData from '../helpers/SpanData';
export default class FoxxReporter extends Reporter {
    private readonly collector;
    constructor(namespace?: string);
    report(traces: SpanData[][]): void;
}
//# sourceMappingURL=FoxxReporter.d.ts.map