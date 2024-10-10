import "./tracing"
import express, { Request, Response } from 'express';
import { trace, SpanStatusCode } from '@opentelemetry/api';
import { download } from "./download";
import { applyTextWithImagemagick } from "./applyTextWithImagemagick";
import path from 'path';
import { logger } from './log-with-winston';
import winstonExpress from 'express-winston';

const app = express();
app.use(winstonExpress.logger({
    winstonInstance: logger,
    msg: "HTTP {{req.method}} {{req.url}}",
    expressFormat: true,
    colorize: false,
    ignoreRoute: function () { return false; }
}));
const PORT = 10114;

// Middleware to parse JSON bodies
app.use(express.json());

app.get("/health", (req: Request, res: Response) => {
    res.send("OK");
});

app.post('/applyPhraseToPicture', async (req, res) => {
    const span = trace.getActiveSpan();
    try {
        const input = req.body;
        let { phrase: inputPhrase, imageUrl } = input;
        span?.setAttributes({
            "app.phrase": inputPhrase, "app.imageUrl": imageUrl,
            "app.imageExtension": imageUrl ? path.extname(imageUrl) : "none"
        });
        const phrase = inputPhrase.toLocaleUpperCase();

        // download the image, defaulting to a local image
        const inputImagePath = await download(imageUrl);

        await trace.getTracer('meminator').startActiveSpan('apply text', async (newSpan) => { 
            logger.log('info', "Using ImageMagick to apply text to image");
            // the same old way
            const outputImagePath = await applyTextWithImagemagick(phrase, inputImagePath);
            res.sendFile(outputImagePath);
            newSpan.end(); // you don't get telemetry for creating spans. You get it for ending spans
        });
    }
    catch (error) {
        span?.recordException(error as Error); 
        span?.setStatus({ code: SpanStatusCode.ERROR, message: (error as Error).message });
        console.error('Error creating picture:', error);
        res.status(500).send('Internal Server Error');
    }
})

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
