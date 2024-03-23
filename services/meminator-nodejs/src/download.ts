import fs from 'fs';
import { trace } from '@opentelemetry/api';
import crypto from 'crypto';
import path from 'path';

const DEFAULT_IMAGE_PATH = '../tmp/BusinessWitch.png';

/**
 * Download an image. If it fails, return a default on that lives on the filesystem
 * @param inputImageUrl 
 * @param inputImagePath 
 * @param req 
 * @returns 
 */
export async function download(params: { imageUrl?: string }) {
    const inputImageUrl = params.imageUrl;
    if (!inputImageUrl) {
        trace.getActiveSpan()?.setAttributes({
            "warn.message": "No imageUrl provided",
            "app.download.input": JSON.stringify(params),
            "app.default.imagePath": DEFAULT_IMAGE_PATH,
        });
        return path.join(__dirname, DEFAULT_IMAGE_PATH);
    }
    const downloadDestinationPath = `/tmp/${generateRandomFilename('png')}`;

    await fetch(inputImageUrl)
        .then(async (download) => {
            const dest = fs.createWriteStream(downloadDestinationPath);
            // ugh this is SO MESSY
            // node-fetch would make this a v simple pipe, but NOOOO, I cannot manage to import that. ESModules something somehting give up
            if (download.body === null) {
                throw new Error(`Failed to fetch picture from meminator: ${download.status} ${download.statusText}`);
            }
            const reader = download.body.getReader();
            // Stream the chunks of the picture data to the response as they are received
            while (true) {
                const { done, value } = await reader.read();
                if (done) {
                    break;
                }
                dest.write(value);
            }
        })
        .catch((err: Error) => {
            trace.getActiveSpan()?.setAttributes({
                "warn.message": "Image failed to download: " + err.message,
                "app.inputImageUrl": inputImageUrl,
                "app.default.imagePath": DEFAULT_IMAGE_PATH,
            });
            return path.join(__dirname, DEFAULT_IMAGE_PATH);
        });

    trace.getActiveSpan()?.setAttributes({
        "app.download.inputImageUrl": inputImageUrl,
        "app.download.downloadDestinationPath": downloadDestinationPath,
    });
    return downloadDestinationPath;
}

export function generateRandomFilename(extension: string): string {
    const randomBytes = crypto.randomBytes(16).toString('hex');
    return `${randomBytes}.${extension}`;
}