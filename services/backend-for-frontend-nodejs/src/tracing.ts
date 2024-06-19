import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-proto";
import * as opentelemetry from '@opentelemetry/api';

opentelemetry.diag.setLogger( // INSTRUMENTATION: make it tell you when it fails to send traces
    new opentelemetry.DiagConsoleLogger(),
    opentelemetry.DiagLogLevel.INFO
);

// The Trace Exporter uses environment variables for endpoint, service name, and API Key.
const traceExporter = new OTLPTraceExporter();

const sdk = new NodeSDK({
    traceExporter,
    instrumentations: [getNodeAutoInstrumentations(
        { '@opentelemetry/instrumentation-fs': { enabled: false } } // INSTRUMENTATION: remove the noisy spans that we don't use
    )]
});

sdk.start();

console.log("Started OpenTelemetry SDK");

// Now logging

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
    body: 'this is a log record body',
    attributes: { 'stuff': 'and things' },
});