
import { Context } from '@opentelemetry/api';
import { ReadableSpan, Span, SpanProcessor } from '@opentelemetry/sdk-trace-base';

import { statfs } from 'fs';
import { IMAGE_STORAGE_PATH } from './configuratino';

type Space = {
    free: number; // these are in bytes
    available: number;
    used: number;
}

function fetchAvailableSpace(): Promise<Space> {
    return new Promise((resolve, reject) => {
        statfs(IMAGE_STORAGE_PATH, (err, stats) => {
            if (err) {
                reject(err);
            }
            const result = {
                free: stats.bsize * stats.bfree,
                available: stats.bsize * stats.bavail,
                used: stats.bsize * (stats.blocks - stats.bfree)
            };
            resolve(result);
        });
    });
}

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
    private readonly availableSpace = new MetricKnowerAbouter<Space>(() => fetchAvailableSpace(), 1000);

    onStart(span: Span, _parentContext: Context): void {
        span.setAttribute('metrics.processor', 'AddMetricsSpanProcessor');
        const space = this.availableSpace.get();
        if (space) {
            span.setAttributes({
                'metrics.diskSpace.free': space.free,
                'metrics.diskSpace.available': space.available,
                'metrics.diskSpace.used': space.used
            });

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