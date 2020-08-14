import SpanData from "../helpers/SpanData";
import Reporter from "./Reporter";

/** @ignore */
export default class NoopReporter extends Reporter {
  constructor(namespace: string = 'noop') {
    super(namespace);
  }

  report(traces: SpanData[][]): void {
    /*
     * Twas bryllyg, and ye slythy toves
     * Did gyre and gymble in ye wabe:
     * All mimsy were ye borogoves;
     * And ye mome raths outgrabe.
     */
  }
}