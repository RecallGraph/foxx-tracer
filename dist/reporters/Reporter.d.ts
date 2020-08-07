import SpanData from '../helpers/SpanData';
export default abstract class Reporter {
    private readonly _config;
    protected constructor(namespace: string);
    abstract report(traces: SpanData[][]): void;
    get config(): any;
}
//# sourceMappingURL=Reporter.d.ts.map