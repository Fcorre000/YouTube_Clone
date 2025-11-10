import express from 'express';
import {isVideoNew, setVideo} from './firestore';

import { 
  uploadProcessedVideo,
  downloadRawVideo,
  deleteRawVideo,
  deleteProcessedVideo,
  convertVideo,
  setupDirectories,
  generateThumbnail,
  uploadThumbnail,
  deleteThumbnail
} from './storage';

// Create the local directories for videos
setupDirectories();

const app = express();
app.use(express.json());
app.get('/', (req, res) => {
  res.status(200).send('OK');
});

// Process a video file from Cloud Storage into 360p
app.post("/process-video", async (req, res) => {

  // Get the bucket and filename from the Cloud Pub/Sub message
  let data;
  try {
    const message = Buffer.from(req.body.message.data, 'base64').toString('utf8');
    data = JSON.parse(message);
    if (!data.name) {
      throw new Error('Invalid message payload received.');
    }
  } catch (error) {
    console.error(error);
    res.status(400).send('Bad Request: missing filename.');
    return;
  }

  const inputFileName = data.name;// format of <UID>-<DATE>.<EXTENSION>
  const outputFileName = `processed-${inputFileName}`;
  const videoId = inputFileName.split('.')[0];
  const thumbnailName = `${videoId}.jpg`;

  if(!isVideoNew(videoId)){
    res.status(400).send('Bad Request: video already processing or processed');
    return 
  }else{
    await setVideo(videoId, {
      id: videoId,
      uid: videoId.split('-')[0],
      status: "processing"
    });
  }

  // Download the raw video from Cloud Storage
  try {
    await downloadRawVideo(inputFileName);
  } catch (error: any) {
    console.error(`Failed to download raw video ${inputFileName}:`, error);
    // Check if it's a "not found" error (Google Cloud Storage API returns 404)
    if (error.code === 404) {
      res.status(404).send(`Error: Raw video ${inputFileName} not found in bucket.`);
    } else {
      res.status(500).send(`Error downloading raw video: ${error.message}`);
    }
    return;
  }

  // Process the video into 360p
  try { 
    await convertVideo(inputFileName, outputFileName)
  } catch (err) {
    await Promise.all([
      deleteRawVideo(inputFileName),
      deleteProcessedVideo(outputFileName)
    ]);
    res.status(500).send('Processing failed');
    return;
  }

  // Generate a thumbnail from the video
  try {
    await generateThumbnail(inputFileName, thumbnailName);
  } catch (err) {
    // Cleanup local files
    await Promise.all([
      deleteRawVideo(inputFileName),
      deleteProcessedVideo(outputFileName),
      deleteThumbnail(thumbnailName)
    ]);
    res.status(500).send('Thumbnail generation failed');
    return;
  }
  
  // Upload the processed video and thumbnail to Cloud Storage
  await Promise.all([
    uploadProcessedVideo(outputFileName),
    uploadThumbnail(thumbnailName)
  ]);

  await setVideo(videoId,{
    status: "processed",
    filename: outputFileName,
    thumbnailUrl: `https://storage.googleapis.com/fc-yt-thumbnails/${thumbnailName}`
  })

  await Promise.all([
    deleteRawVideo(inputFileName),
    deleteProcessedVideo(outputFileName),
    deleteThumbnail(thumbnailName)
  ]);

  res.status(200).send('Processing finished successfully');
  return;
});

const port = process.env.PORT || 8080;
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
}).on('error', (err: Error) => {
    console.error('Server failed to start:', err);
    process.exit(1); // Exit if server fails to start
});

console.log(`Attempting to start server on port: ${port}`);

