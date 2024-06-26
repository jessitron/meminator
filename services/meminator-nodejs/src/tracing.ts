import { NodeSDK } from '@opentelemetry/sdk-node';
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-proto";
import * as opentelemetry from '@opentelemetry/api';
import { AddMetricsSpanProcessor } from './putMetricsOnSpans';

opentelemetry.diag.setLogger(
    new opentelemetry.DiagConsoleLogger(),
    opentelemetry.DiagLogLevel.INFO
);
// The Trace Exporter exports the data to Honeycomb and uses
// environment variables for endpoint, service name, and API Key.
const traceExporter = new OTLPTraceExporter();

const sdk = new NodeSDK({
    spanProcessors: [new AddMetricsSpanProcessor(), new BatchSpanProcessor(traceExporter, {
        maxQueueSize: 5000, // at startup, we get a LOT of spans from fs-instrumentation
        scheduledDelayMillis: 1000,
    })],
    instrumentations: [getNodeAutoInstrumentations(
        // { '@opentelemetry/instrumentation-fs': { enabled: false } } // the fs tracing might be interesting here!
    ),]
});

sdk.start();

console.log("Started OpenTelemetry SDK");

import * as logsAPI from "@opentelemetry/api-logs";
import {
    LoggerProvider,
    BatchLogRecordProcessor,
} from "@opentelemetry/sdk-logs";
import { Resource } from "@opentelemetry/resources";
import { SEMRESATTRS_SERVICE_NAME } from "@opentelemetry/semantic-conventions";
import { OTLPLogExporter } from "@opentelemetry/exporter-logs-otlp-http";

console.log("Initializing OpenTelemetry Logging...");

// gotta make a provider
const loggerProvider = new LoggerProvider({
    resource: new Resource({
        // in order to give it a service name.
        [SEMRESATTRS_SERVICE_NAME]: process.env.OTEL_SERVICE_NAME,
    }),
});

// tell it where to put them
loggerProvider.addLogRecordProcessor(
    new BatchLogRecordProcessor(
        // by default, this will send to a local OpenTelemetry Collector
        new OTLPLogExporter()
    )
);

// logger provider, activate!
logsAPI.logs.setGlobalLoggerProvider(loggerProvider);

// test log
const logger = logsAPI.logs.getLogger('test');

// emit a log record
logger.emit({
    severityNumber: logsAPI.SeverityNumber.INFO,
    severityText: 'JESS WAS HERE',
    body: 'Starting up, logging initialized',
    attributes: { 'stuff': 'and things' },
});