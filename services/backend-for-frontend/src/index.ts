import "./tracing"
import express, { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { trace } from '@opentelemetry/api';
import { fetchFromService } from "./o11yday-lib";

const app = express();
const PORT = 3000; // You can change the port number as needed

// Middleware to parse JSON bodies
app.use(express.json());

app.get("/health", (req: Request, res: Response) => {
    res.send({ message: "I am here", status_code: 0 });
});

app.post('/createPicture', async (req, res) => {
    try {
        // Make a request to the meminator service
        const response = await fetchFromService('meminator');

        // Check if the response was successful (status code 200)
        if (!response.ok) {
            throw new Error(`Failed to fetch picture from meminator: ${response.status} ${response.statusText}`);
        }
        if (response.body === null) {
            throw new Error(`Failed to fetch picture from meminator: ${response.status} ${response.statusText}`);
        }

        res.contentType('image/png');
        // Read the response body as binary data
        const reader = response.body.getReader();
        // Stream the chunks of the picture data to the response as they are received
        while (true) {
            const { done, value } = await reader.read();

            if (done) {
                break;
            }

            res.write(value);
        }
        res.end()

    } catch (error) {
        trace.getActiveSpan()?.recordException(error as Error);
        console.error('Error fetching picture from meminator:', error);
        res.status(500).send('Internal Server Error');
    }
});


// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
