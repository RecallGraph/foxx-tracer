/* eslint-disable import/no-extraneous-dependencies */
import {DebugInfo, FoxxSpan} from './foxx_span';

/**
 * Index a collection of reported FoxxSpans in a way that's easy to run unit
 * test assertions against.
 */
export class FoxxReport {

    spans: FoxxSpan[];
    private spansByUUID: { [uuid: string]: FoxxSpan };
    private spansByTag: { [key: string]: { [value: string]: FoxxSpan[] } };
    private debugSpans: DebugInfo[];
    private unfinishedSpans: FoxxSpan[];

    constructor(spans: FoxxSpan[]) {
        this.spans = spans;
        this.spansByUUID = {};
        this.spansByTag = {};
        this.debugSpans = [];

        this.unfinishedSpans = [];

        spans.forEach(span => {
            if (span._finishMs === 0) {
                this.unfinishedSpans.push(span);
            }

            this.spansByUUID[span.uuid()] = span;
            this.debugSpans.push(span.debug());

            const tags = span.tags();

            Object.keys(tags).forEach((key: string) => {
                const val = tags[key];
                this.spansByTag[key] = this.spansByTag[key] || {};
                this.spansByTag[key][val] = this.spansByTag[key][val] || [];
                this.spansByTag[key][val].push(span);
            });
        });
    }

    firstSpanWithTagValue(key: string, val: any): FoxxSpan | null {
        const m = this.spansByTag[key];
        if (!m) {
            return null;
        }
        const n = m[val];
        if (!n) {
            return null;
        }
        return n[0];
    }
}

export default FoxxReport;
