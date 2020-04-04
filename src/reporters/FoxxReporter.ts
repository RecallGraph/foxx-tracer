import Reporter from './Reporter';
import SpanData from '../SpanData';

const request = require('@arangodb/request');

export default class FoxxReporter implements Reporter {
    private readonly collectorURL: string;
    private readonly service: string;

    constructor(collectorURL: string, service: string) {
        this.collectorURL = collectorURL;
        this.service = service;
    }

    report(traces: [[SpanData]]): void {
        // request.put(this.collectorURL, {
        //     json: true,
        //     body: ddTraces,
        //     headers: {
        //         'X-Datadog-Trace-Count': `${ddTraces.length}`
        //     }
        // });
    }
}