import Reporter from './Reporter';
import SpanData from '../helpers/SpanData';
export default class FoxxReporter extends Reporter {
    constructor(namespace?: string);
    report(traces: SpanData[][]): void;
}
//# sourceMappingURL=FoxxReporter.d.ts.map