#!/bin/bash

# This script automates the deployment of the yt-web-client to Google Cloud Run.

# Exit immediately if a command exits with a non-zero status.
set -e

# Check if PROJECT_ID is provided
if [ -z "$1" ]; then
  echo "Usage: ./deploy.sh <PROJECT_ID>"
  exit 1
fi

PROJECT_ID=$1
REPO="yt-web-client-repo"
IMAGE_NAME="yt-web-client"
REGION="us-central1"
IMAGE_TAG="us-central1-docker.pkg.dev/${PROJECT_ID}/${REPO}/${IMAGE_NAME}"

echo "--- Starting deployment for project: ${PROJECT_ID} ---"

# Build the Docker image.
# Add --platform linux/amd64 for Mac users.
echo "--- 1. Building Docker image ---"
if [[ "$(uname)" == "Darwin" ]]; then
  docker build --platform linux/amd64 -t ${IMAGE_TAG} .
else
  docker build -t ${IMAGE_TAG} .
fi
echo "--- Docker image built successfully ---"

# Push the Docker image to Google Artifact Registry.
echo "--- 2. Pushing Docker image to Artifact Registry ---"
docker push ${IMAGE_TAG}
echo "--- Docker image pushed successfully ---"

# Deploy the Docker image to Cloud Run.
echo "--- 3. Deploying to Cloud Run ---"
gcloud run deploy yt-web-client \
  --image ${IMAGE_TAG} \
  --region=${REGION} \
  --platform managed \
  --timeout=3600 \
  --memory=2Gi \
  --cpu=1 \
  --min-instances=0 \
  --max-instances=1 \
  --allow-unauthenticated

echo "--- Deployment successful! ---"
SERVICE_URL=$(gcloud run services describe yt-web-client --platform managed --region ${REGION} --format 'value(status.url)')
echo "Service URL: ${SERVICE_URL}"
echo "Note: If this is your first deployment, you may need to add the service URL to the Firebase Auth authorized domains."
