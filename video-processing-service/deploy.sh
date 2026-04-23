#!/bin/bash

# This script automates the deployment of the video-processing-service to Google Cloud Run.

# Exit immediately if a command exits with a non-zero status.
set -e

# Check if PROJECT_ID is provided
if [ -z "$1" ]; then
  echo "Usage: ./deploy.sh <PROJECT_ID>"
  exit 1
fi

PROJECT_ID=$1
REPO="video-processing-service-repo"
IMAGE_NAME="video-processing-service"
REGION="us-central1"
IMAGE_TAG="us-central1-docker.pkg.dev/${PROJECT_ID}/${REPO}/${IMAGE_NAME}"

echo "--- Starting deployment for project: ${PROJECT_ID} ---"

# 1. Create Artifact Registry repository if it doesn't exist
if ! gcloud artifacts repositories describe ${REPO} --location=${REGION} --project=${PROJECT_ID} &> /dev/null; then
  echo "--- Creating Artifact Registry repository: ${REPO} ---"
  gcloud artifacts repositories create ${REPO} \
    --repository-format=docker \
    --location=${REGION} \
    --project=${PROJECT_ID}
  echo "--- Repository created successfully ---"
else
  echo "--- Repository ${REPO} already exists ---"
fi

# 2. Build the Docker image.
# Add --platform linux/amd64 for Mac users.
echo "--- Building Docker image ---"
if [[ "$(uname)" == "Darwin" ]]; then
  docker build --platform linux/amd64 -t ${IMAGE_TAG} -f video-processing-service/Dockerfile video-processing-service
else
  docker build -t ${IMAGE_TAG} -f video-processing-service/Dockerfile video-processing-service
fi
echo "--- Docker image built successfully ---"

# 3. Push the Docker image to Google Artifact Registry.
echo "--- Pushing Docker image to Artifact Registry ---"
docker push ${IMAGE_TAG}
echo "--- Docker image pushed successfully ---"

# 4. Deploy the Docker image to Cloud Run.
echo "--- Deploying to Cloud Run ---"
gcloud run deploy video-processing-service \
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
SERVICE_URL=$(gcloud run services describe video-processing-service --platform managed --region ${REGION} --format 'value(status.url)')
echo "Service URL: ${SERVICE_URL}"
