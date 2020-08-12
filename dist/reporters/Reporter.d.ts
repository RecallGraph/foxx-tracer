import SpanData from '../helpers/SpanData';
export default abstract class Reporter {
    private readonly _config;
    protected constructor(namespace: string);
    get config(): any;
    abstract report(traces: SpanData[][]): void;
}
//# sourceMappingURL=Reporter.d.ts.map