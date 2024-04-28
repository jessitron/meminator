import "./tracing"
import express, { Request, Response } from 'express';
import { trace } from '@opentelemetry/api';
import { spawnProcess } from "./shellOut";
import { download, generateRandomFilename } from "./download";

const app = express();
const PORT = 10114;

// Middleware to parse JSON bodies
app.use(express.json());

app.get("/health", (req: Request, res: Response) => {
    res.send("OK");
});

// const magickProcess = spawn('convert', [inputImagePath, '-gravity', 'center', '-pointsize', '36', '-fill', 'white', '-annotate', '0', phrase, outputImagePath]);
// convert tmp/BusinessWitch.png -gravity center -pointsize 36 -fill white -annotate 0 "Business Witch" output.png

/*
convert tmp/BusinessWitch.png -fill white -undercolor '#00000080' -gravity North -font "Times-Roman" -weight bold -annotate +0+10 "DO THE THING" \
    output_image.jpg
    */

const DEFAULT_PHRASE = "you got this";

app.post('/applyPhraseToPicture', async (req, res) => {
    // const span = trace.getActiveSpan();
    try {
        const input = req.body;
        let { phrase: inputPhrase, imageUrl } = input;
        // span?.setAttributes({ // INSTRUMENTATION: record important things
        //     "app.meminator.phrase": inputPhrase, "app.meminator.imageUrl": imageUrl,
        //     "app.meminator.imageExtension": imageUrl ? path.extname(imageUrl) : "none"
        // });
        if (!inputPhrase) {
            // span?.setAttributes({
            //     "warn.message": "No phrase provided",
            //     "app.default.phrase": DEFAULT_PHRASE,
            //     "app.body": JSON.stringify(req.body)
            // });
            inputPhrase = DEFAULT_PHRASE;
        }
        const phrase = inputPhrase.toLocaleUpperCase();

        // download the image, defaulting to a local image
        const inputImagePath = await download(input);

        const outputImagePath = await modifyImage(phrase, inputImagePath);
        res.sendFile(outputImagePath);
    }
    catch (error) {
        // span?.recordException(error as Error); // INSTRUMENTATION: record exceptions. This will someday happen automatically in express instrumentation
        // span?.setStatus({ code: SpanStatusCode.ERROR, message: (error as Error).message });
        console.error('Error creating picture:', error);
        res.status(500).send('Internal Server Error');
    }
})


const IMAGE_MAX_HEIGHT_PX = 1000;
const IMAGE_MAX_WIDTH_PX = 1000;

async function modifyImage(phrase: string, inputImagePath: string) {
    const outputImagePath = `/tmp/${generateRandomFilename('png')}`;
    trace.getActiveSpan()?.setAttributes({
        "app.phrase": phrase,
        "app.meminate.inputImagePath": inputImagePath,
        "app.meminate.outputImagePath": outputImagePath,
        "app.meminate.maxHeightPx": IMAGE_MAX_HEIGHT_PX,
        "app.meminate.maxWidthPx": IMAGE_MAX_WIDTH_PX,
    });

    const args = [inputImagePath,
        '-resize', `${IMAGE_MAX_WIDTH_PX}x${IMAGE_MAX_HEIGHT_PX}\>`,
        '-gravity', 'North',
        '-pointsize', '48',
        '-fill', 'white',
        '-undercolor', '#00000080',
        '-font', 'Angkor-Regular',
        '-annotate', '0', `${phrase}`,
        outputImagePath];

    await spawnProcess('convert', args);
    return outputImagePath
}




// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
