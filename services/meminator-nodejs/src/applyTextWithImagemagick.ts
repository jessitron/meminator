
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

    const pointsize = 48;
    const font = 'Angkor-Regular';
    const args = [inputImagePath,
        '-resize', `${IMAGE_MAX_WIDTH_PX}x${IMAGE_MAX_HEIGHT_PX}\>`,
        '-gravity', 'North',
        '-pointsize', `${pointsize}`,
        '-fill', 'white',
        '-undercolor', '#00000080',
        '-font', font,
        '-annotate', '0', `${phrase}`,
        outputImagePath];


    const processResult = await spawnProcess('convert', args);

    // don't wait for this
    checkWhetherTextFits(pointsize, font, phrase, outputImagePath);

    return outputImagePath
}

async function checkWhetherTextFits(pointsize: number, font: string, text: string, imageFilename: string) {
    return inSpanAsync('measure text width', { attributes: { "text.pointsize": pointsize, "text.font": font, "text.content": text, "text.length": text.length } }, async (span) => {
        const textWidth = await measureTextWidth(pointsize, font, text);
        const imageWidth = await measureImageWidth(imageFilename);
        if (textWidth > imageWidth) {
            logger.log('warn', `Text width is greater than image width: ${textWidth} > ${imageWidth}`, { "text.width": textWidth, "image.width": imageWidth, "text.content": text });
        }
        span.setAttributes({ 'text.width': textWidth, "image.width": imageWidth, "text.doesItFit": textWidth <= imageWidth });
    });
}

async function measureTextWidth(pointsize: number, font: string, text: string): Promise<number> {
    const result = await spawnProcess('convert', ['-pointsize', `${pointsize}`, '-font', `${font}`, '-format', '%w', `caption:${text}`, 'info:'])
    // convert stdout to int
    const width = parseInt(result.stdout);
    if (Number.isNaN(width)) {
        throw new Error(`Could not parse width from ImageMagick output: ${result.stdout}`);
    }
    return width;
}

async function measureImageWidth(filepath: string) {
    const result = await spawnProcess('identify', ['-format', '%w', filepath]).then((result) => {
        logger.log('debug', `Identify on output file: ${result.stdout}`, { "identify.filepath": filepath, "identify.width": result.stdout, "identify.error": result.stderr })
        return result
    })
    const width = parseInt(result.stdout);
    if (Number.isNaN(width)) {
        throw new Error(`Could not parse width from ImageMagick output: ${result.stdout}`);
    }
    return width;
}