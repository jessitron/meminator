/**
 * This represents an internal library used for communication between services.
 * That is a common pattern, and a great place to customize some telemetry.
 */

import { W3CTraceContextPropagator } from '@opentelemetry/core';
import { context, defaultTextMapSetter, trace, Attributes, SpanStatusCode, Span, SpanKind, SpanOptions } from '@opentelemetry/api';
import { SEMATTRS_HTTP_METHOD, SEMATTRS_HTTP_URL } from '@opentelemetry/semantic-conventions';

const SERVICES = {
    meminator: 'http://meminator:3000/applyPhraseToPicture',
    'phrase-picker': 'http://phrase-picker:3000/phrase'
}

export function fetchFromService(service: keyof typeof SERVICES) {

    return inSpanAsync("fetchFromService", { attributes: { "service": service }, kind: SpanKind.CLIENT, }, async (span) => {

        // propagation
        const headers: Record<string, string> = {};
        const propagator = new W3CTraceContextPropagator();
        propagator.inject(context.active(), headers, defaultTextMapSetter);

        const url = SERVICES[service];
        span.setAttributes({ "http.headers": JSON.stringify(headers), [SEMATTRS_HTTP_METHOD]: "GET", [SEMATTRS_HTTP_URL]: url });

        const response = await fetch(url, { headers });

        span.setAttributes({
            "http.status_code": response.status,
            "http.status_text": response.statusText,
            "http.redirected": response.redirected,
        });
        if (!response.ok) {
            span.setStatus({ code: SpanStatusCode.ERROR, message: await response.clone().text() });
        }
        return response;
    });
}

const tracer = trace.getTracer("o11yday-lib");

/**
 * Use this to wrap _synchronous_ code in a span.
 * @param name name of the span
 * @param attributes 
 * @param fn 
 * @returns 
 */
export function inSpan<T>(name: string, attributes: Attributes, fn: () => T): T {
    return tracer.startActiveSpan(
        name,
        {
            attributes // this is a great place to add standard ones
        },
        context.active(),
        (span) => {
            try {
                const result = fn();
                return result;
            } catch (e) {
                if (e instanceof Error) {
                    span.recordException(e);
                    span.setStatus({ code: SpanStatusCode.ERROR, message: e.message });
                } else {
                    span.setStatus({ code: SpanStatusCode.ERROR, message: "some error that is not an Error: " + e });
                }
                throw e;
            } finally {
                span.end();
            }
        }
    );
}

/**
 * Use this to wrap asynchronous code in a span.
 * @param name name of the span
 * @param attributes 
 * @param fn async 
 * @returns 
 */
export function inSpanAsync<T>(name: string, options: SpanOptions, fn: (span: Span) => Promise<T>): Promise<T> {
    return tracer.startActiveSpan(
        name,
        {
            ...options
        },
        context.active(),
        async (span) => {
            try {
                const result = await fn(span);
                return result;
            } catch (e) {
                if (e instanceof Error) {
                    span.recordException(e);
                    span.setStatus({ code: SpanStatusCode.ERROR, message: e.message });
                } else {
                    span.setStatus({ code: SpanStatusCode.ERROR, message: "some error that is not an Error: " + e });
                }
                throw e;
            } finally {
                span.end();
            }
        }
    );
}