
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

    // don't wait for this. Just make a judgement
    reportPredictedWidth(inputImagePath);

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
    return inSpanAsync('check text width', { attributes: { "text.pointsize": pointsize, "text.font": font, "text.content": text, "text.length": text.length } }, async (span) => {
        const { width: imageWidth, density: imageDensity } = await measureImageWidthAndDensity(imageFilename);
        span.setAttributes({ 'image.width': imageWidth, 'image.density': imageDensity });
        const textWidth = await measureTextWidth(pointsize, font, imageDensity, text,);
        if (textWidth > imageWidth) {
            logger.log('warn', `Text width is greater than image width: ${textWidth} > ${imageWidth}`, {
                "text.width": textWidth,
                "image.width": imageWidth,
                "text.content": text,
                "image.density": imageDensity,
                "text.length": text.length
            });
        }
        span.setAttributes({ 'text.width': textWidth, "image.width": imageWidth, "text.doesItFit": textWidth <= imageWidth });
    });
}

async function measureTextWidth(pointsize: number, font: string, imageDensity: number, text: string): Promise<number> {
    const result = await spawnProcess('convert', [
        '-pointsize', `${pointsize}`,
        '-font', `${font}`,
        '-format', '%w',
        //   '-density', `${imageDensity}`,
        `label:${text}`,
        'info:'])
    // convert stdout to int
    const width = parseInt(result.stdout);
    if (Number.isNaN(width)) {
        throw new Error(`Could not parse width from ImageMagick output: ${result.stdout}`);
    }
    return width;
}

async function measureImageWidthAndDensity(filepath: string) {
    return await spawnProcess('identify', ['-format', '%w %x', filepath]).then((result) => {
        const [width, density] = result.stdout.split(' ').map((s) => parseInt(s));
        logger.log('debug', `Identify on output file: ${result.stdout}`, {
            "identify.filepath": filepath,
            "identify.width": width,
            "identify.density": density,
            "identify.error": result.stderr
        })
        return { width, density }
    });
}

async function reportPredictedWidth(imageFilename: string) {
    return inSpanAsync('predict image width', { attributes: { "image.filename": imageFilename } }, async (span) => {
        const width = await predictImageWidth(imageFilename);
        span.setAttribute('image.predictedWidth', width);
    });
}

async function predictImageWidth(imageFilename: string) {
    const result = await spawnProcess('identify', ['-format', '%wx%h', imageFilename]);
    if (result.code !== 0) {
        throw new Error(`Could not get image dimensions from ImageMagick: ${result.stderr}`);
    }
    const [width, height] = result.stdout.split('x').map((s) => parseInt(s));
    // we are going to resize the  image to IMAGE_MAX_WIDTH_PX x IMAGE_MAX_HEIGHT_PX
    const ratioForHeightLimitation = Math.min(IMAGE_MAX_HEIGHT_PX / height, 1);
    const widthLimitedByHeight = width * ratioForHeightLimitation;
    const finalWidth = Math.min(width, IMAGE_MAX_WIDTH_PX, widthLimitedByHeight)
    trace.getActiveSpan()?.setAttributes({
        "image.width": width,
        "image.height": height,
        "image.ratioForHeightLimitation": ratioForHeightLimitation,
        "image.widthLimitedByHeight": widthLimitedByHeight,
        "image.maxWidth": IMAGE_MAX_WIDTH_PX,
        "image.maxHeight": IMAGE_MAX_HEIGHT_PX,
        "image.finalWidth": finalWidth,
    });
    return finalWidth;
}