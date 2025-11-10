"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const firestore_1 = require("./firestore");
const storage_1 = require("./storage");
// Create the local directories for videos
(0, storage_1.setupDirectories)();
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.get('/', (req, res) => {
    res.status(200).send('OK');
});
// Process a video file from Cloud Storage into 360p
app.post("/process-video", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // Get the bucket and filename from the Cloud Pub/Sub message
    let data;
    try {
        const message = Buffer.from(req.body.message.data, 'base64').toString('utf8');
        data = JSON.parse(message);
        if (!data.name) {
            throw new Error('Invalid message payload received.');
        }
    }
    catch (error) {
        console.error(error);
        res.status(400).send('Bad Request: missing filename.');
        return;
    }
    const inputFileName = data.name; // format of <UID>-<DATE>.<EXTENSION>
    const outputFileName = `processed-${inputFileName}`;
    const videoId = inputFileName.split('.')[0];
    const thumbnailName = `${videoId}.jpg`;
    if (!(0, firestore_1.isVideoNew)(videoId)) {
        res.status(400).send('Bad Request: video already processing or processed');
        return;
    }
    else {
        yield (0, firestore_1.setVideo)(videoId, {
            id: videoId,
            uid: videoId.split('-')[0],
            status: "processing"
        });
    }
    // Download the raw video from Cloud Storage
    try {
        yield (0, storage_1.downloadRawVideo)(inputFileName);
    }
    catch (error) {
        console.error(`Failed to download raw video ${inputFileName}:`, error);
        // Check if it's a "not found" error (Google Cloud Storage API returns 404)
        if (error.code === 404) {
            res.status(404).send(`Error: Raw video ${inputFileName} not found in bucket.`);
        }
        else {
            res.status(500).send(`Error downloading raw video: ${error.message}`);
        }
        return;
    }
    // Process the video into 360p
    try {
        yield (0, storage_1.convertVideo)(inputFileName, outputFileName);
    }
    catch (err) {
        yield Promise.all([
            (0, storage_1.deleteRawVideo)(inputFileName),
            (0, storage_1.deleteProcessedVideo)(outputFileName)
        ]);
        res.status(500).send('Processing failed');
        return;
    }
    // Generate a thumbnail from the video
    try {
        yield (0, storage_1.generateThumbnail)(inputFileName, thumbnailName);
    }
    catch (err) {
        // Cleanup local files
        yield Promise.all([
            (0, storage_1.deleteRawVideo)(inputFileName),
            (0, storage_1.deleteProcessedVideo)(outputFileName),
            (0, storage_1.deleteThumbnail)(thumbnailName)
        ]);
        res.status(500).send('Thumbnail generation failed');
        return;
    }
    // Upload the processed video and thumbnail to Cloud Storage
    yield Promise.all([
        (0, storage_1.uploadProcessedVideo)(outputFileName),
        (0, storage_1.uploadThumbnail)(thumbnailName)
    ]);
    yield (0, firestore_1.setVideo)(videoId, {
        status: "processed",
        filename: outputFileName,
        thumbnailUrl: `https://storage.googleapis.com/fc-yt-thumbnails/${thumbnailName}`
    });
    yield Promise.all([
        (0, storage_1.deleteRawVideo)(inputFileName),
        (0, storage_1.deleteProcessedVideo)(outputFileName),
        (0, storage_1.deleteThumbnail)(thumbnailName)
    ]);
    res.status(200).send('Processing finished successfully');
    return;
}));
const port = process.env.PORT || 8080;
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
}).on('error', (err) => {
    console.error('Server failed to start:', err);
    process.exit(1); // Exit if server fails to start
});
console.log(`Attempting to start server on port: ${port}`);
