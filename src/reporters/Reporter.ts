import SpanData from '../SpanData';

export default interface Reporter {
    report(traces: [[SpanData]]): void;
}