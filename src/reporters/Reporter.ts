import SpanData from '../helpers/SpanData';

export default interface Reporter {
  report(traces: [[SpanData]]): void;
}