
import { generateRandomFilename } from "./download";
import { trace } from '@opentelemetry/api';
import { spawnProcess } from "./shellOut";
import { logger } from './log-with-winston';
import { inSpanAsync } from "./o11yday-lib";

const IMAGE_MAX_HEIGHT_PX = 1000;
const IMAGE_MAX_WIDTH_PX = 1000;

export async function applyTextWithImagemagick(phrase: string, inputImagePath: string) {
    const outputImagePath = `/tmp/${generateRandomFilename('png')}`;
    logger.log('debug', `Applying text to image with ImageMagick: ${phrase} ${inputImagePath} ${outputImagePath}`, {
        phrase, inputImagePath, outputImagePath
    });
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

    measureTextWidth(48, 'Angkor-Regular', phrase);

    const processResult = await spawnProcess('convert', args);

    return outputImagePath
}

async function measureTextWidth(pointsize: number, font: string, text: string): Promise<number> {
    return inSpanAsync('measure text width', { attributes: { "text.pointsize": pointsize, "text.font": font, "text.content": text, "text.length": text.length } }, async (span) => {
        const result = await spawnProcess('convert', ['-pointsize', `${pointsize}`, '-font', `${font}`, '-format', '%w', `caption:${text}`, 'info:'])
        // convert stdout to int
        const width = parseInt(result.stdout);
        if (Number.isNaN(width)) {
            throw new Error(`Could not parse width from ImageMagick output: ${result.stdout}`);
        }
        span.setAttribute('text.width', width);
        span.end();
        return width;
    });
}