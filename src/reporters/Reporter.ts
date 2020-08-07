import SpanData from '../helpers/SpanData';

export default abstract class Reporter {
  private readonly _config;

  protected constructor(namespace: string) {
    this._config = module.context.configuration[`reporters:${namespace}`] || {};
  }

  get config() {
    return this._config;
  }

  abstract report(traces: SpanData[][]): void;
}