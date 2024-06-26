
import { Context } from '@opentelemetry/api';
import { ReadableSpan, Span, SpanProcessor } from '@opentelemetry/sdk-trace-base';

import { statfs } from 'fs';
import { IMAGE_STORAGE_PATH } from './configuratino';
import { check, DiskUsage } from "diskusage"
import { DEFAULT_LOGGER_NAME } from '@opentelemetry/sdk-logs/build/src/LoggerProvider';

class MetricKnowerAbouter<Data> {
    private cache?: { lastFetched: Date, data: Data }

    constructor(private readonly actuallyFetchTheData: () => Promise<Data>,
        private readonly cacheForMs: number = 1000) { this.triggerUpdate(); }

    public get(): Data | undefined {
        return this.cache?.data;
    }

    triggerUpdate() {
        setTimeout(() => this.actuallyFetchTheData().then((data) => {
            this.cache = { data, lastFetched: new Date() };
            this.triggerUpdate();
        }), this.cacheForMs);
    }

    public ageOfData(): number {
        if (!this.cache) {
            return Infinity;
        }
        return new Date().getTime() - this.cache.lastFetched.getTime();
    }
}

export class AddMetricsSpanProcessor implements SpanProcessor {
    private readonly availableSpace = new MetricKnowerAbouter<DiskUsage>(() => check(IMAGE_STORAGE_PATH), 1000);

    onStart(span: Span, _parentContext: Context): void {
        span.setAttribute('metrics.processor', 'AddMetricsSpanProcessor');
        const space = this.availableSpace.get();
        if (space) {
            span.setAttribute('metrics.diskSpace.free', space.free);
            span.setAttribute('metrics.diskSpace.available', space.available);
            span.setAttribute('metrics.diskSpace.used', space.total - space.free);
        }
    }

    onEnd(_span: ReadableSpan): void {
        // that's nice
    }
    shutdown(): Promise<void> {
        return Promise.resolve();
    }
    forceFlush(): Promise<void> {
        return Promise.resolve();
    }
}