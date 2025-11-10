# Gemini Code Assistant Guide

This document provides a guide for using Gemini to assist with development in the YouTube Clone project.

## Project Overview

The project is a YouTube clone with a microservices-based architecture composed of three main parts: a Next.js web client, a Firebase Functions API service, and a containerized video processing service.

### Architecture & Data Flow:

1.  **Video Upload:**
    *   The `yt-web-client` authenticates a user and calls the `generateUploadUrl` Firebase Function from the `yt-api-service`.
    *   The API service generates a unique filename and a pre-signed Google Cloud Storage (GCS) URL for uploading to a bucket named `fc-yt-raw-videos`.
    *   The client uses this URL to upload the video file directly to the raw GCS bucket.

2.  **Video Processing:**
    *   The upload to `fc-yt-raw-videos` triggers a Pub/Sub message.
    *   The `video-processing-service` (a Node.js/Express app) is subscribed to this Pub/Sub topic and receives the message.
    *   It immediately creates a document in the `videos` collection in Firestore with a status of `"processing"` to act as a lock.
    *   The service downloads the raw video, converts it to 360p using `ffmpeg`, and uploads the result to a separate `fc-yt-processed-videos` GCS bucket.
    *   The processed video in this second bucket is made public.
    *   The service then updates the video's document in Firestore, setting the status to `"processed"` and adding the new filename.

3.  **Video Playback:**
    *   The `yt-web-client`'s main page calls the `getVideos` Firebase Function.
    *   This function queries the `videos` collection in Firestore and returns a list of videos that are (presumably) processed.
    *   The frontend renders these videos as links to the watch page, using the public URL of the processed video files.

This architecture effectively decouples the user-facing application from the resource-intensive video processing task, which is a scalable and robust design. The use of pre-signed URLs for uploads and separate buckets for raw and processed media are best practices for security and organization.

## Services

### 1. `yt-web-client`

*   **Description:** A Next.js application that serves as the frontend for the YouTube clone.
*   **Location:** `/yt-web-client`
*   **Key Files:**
    *   `app/page.tsx`: The main landing page of the application. It demonstrates how videos are fetched and displayed to the user.
    *   `app/firebase/functions.ts`: This file is the bridge between the frontend and the backend. It defines the `Video` data structure and contains the functions for calling the backend Firebase Functions for uploading and fetching videos.
*   **How to Run:**
    ```bash
    cd yt-web-client
    npm install
    npm run dev
    ```
*   **How to Deploy:**
    To deploy the web client to Google Cloud Run, navigate to the `yt-web-client` directory and run the `deploy.sh` script with your Google Cloud Project ID:
    ```bash
    cd yt-web-client
    ./deploy.sh YOUR_PROJECT_ID
    ```
    Replace `YOUR_PROJECT_ID` with your actual Google Cloud Project ID.
    The script will build a Docker image, push it to Google Artifact Registry, and deploy it to Cloud Run.
    If this is the first deployment, you may need to add the Cloud Run service URL to the Firebase Auth authorized domains.

### 2. `yt-api-service`

*   **Description:** A Firebase Functions project that serves as the backend API for the YouTube clone.
*   **Location:** `/yt-api-service/functions`
*   **Key Files:**
    *   `src/index.ts`: This is the core of the backend API. It defines the callable functions that the frontend uses. `generateUploadUrl` is critical for the upload process, and `getVideos` is the source of data for the homepage.
*   **How to Run:**
    ```bash
    cd yt-api-service/functions
    npm install
    npm run build
    firebase emulators:start
    ```

### 3. `video-processing-service`

*   **Description:** A Node.js service that processes uploaded videos. It listens for new videos in a GCS bucket, processes them, and saves them to another bucket.
*   **Location:** `/video-processing-service`
*   **Key Files:**
    *   `src/index.ts`: This file contains the main logic for the video processing service. It's an Express server that listens for Pub/Sub messages from Google Cloud Storage and orchestrates the entire video conversion pipeline.
    *   `src/storage.ts`: This file handles all the low-level interactions with Google Cloud Storage and the `ffmpeg` video conversion process. It shows where files are stored (raw vs. processed buckets) and how they are made public.
    *   `src/firestore.ts`: This file manages the state of video processing in the Firestore database. The `setVideo` function with `{merge: true}` is key to the state machine (`processing` -> `processed`), and `isVideoNew` prevents race conditions.
*   **How to Run:**
    ```bash
    cd video-processing-service
    npm install
    npm start
    ```
    *Note: This service is designed to be run in a containerized environment (e.g., Docker) and requires access to Google Cloud services (Pub/Sub, GCS, Firestore) and `ffmpeg`.*

## Development Guidelines

When making changes to the codebase, please adhere to the following guidelines:

*   **Follow existing conventions:** Maintain the existing coding style, structure, and architectural patterns.
*   **One change at a time:** Make small, incremental changes.
*   **Run tests:** Ensure that all tests pass before submitting a change. (No tests are currently implemented).
*   **Update documentation:** If you make any changes to the architecture or add new features, please update this document accordingly.
