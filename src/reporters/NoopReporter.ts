import SpanData from "../helpers/SpanData";
import Reporter from "./Reporter";

export default class NoopReporter extends Reporter {
  constructor(namespace: string = 'noop') {
    super(namespace);
  }

  report(traces: SpanData[][]): void {
  }
}