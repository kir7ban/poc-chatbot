#!/bin/bash
# deploy.sh — Azure deployment for multi-model chatbot (Azure AI Foundry)
# Usage: ./deploy.sh
# Requires: .env file populated, az CLI logged in, npm installed

set -e

RESOURCE_GROUP="rg-poc-chatbot"
APP_NAME="app-poc-chatbot"

if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
fi

MISSING=""
[ -z "$AZURE_AI_ENDPOINT" ]       && MISSING="$MISSING AZURE_AI_ENDPOINT"
[ -z "$AZURE_AI_KEY" ]             && MISSING="$MISSING AZURE_AI_KEY"
[ -z "$COSMOS_CONNECTION_STRING" ] && MISSING="$MISSING COSMOS_CONNECTION_STRING"

if [ -n "$MISSING" ]; then
  echo "ERROR: Missing required env vars:$MISSING"
  exit 1
fi

echo "==> Building React frontend..."
npm run build

echo "==> Creating deployment package..."
zip -r deploy.zip \
  server/ \
  client/dist/ \
  package.json \
  package-lock.json \
  --exclude "*.env" --exclude ".git/*" --exclude "node_modules/*" \
  -q

echo "==> Setting environment variables..."
az webapp config appsettings set \
  --name "$APP_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --settings \
    AZURE_AI_ENDPOINT="$AZURE_AI_ENDPOINT" \
    AZURE_AI_KEY="$AZURE_AI_KEY" \
    CLAUDE_DEPLOYMENT="${CLAUDE_DEPLOYMENT:-claude-3-5-sonnet}" \
    OPENAI_DEPLOYMENT="${OPENAI_DEPLOYMENT:-gpt-4o}" \
    GEMINI_DEPLOYMENT="${GEMINI_DEPLOYMENT:-gemini-1-5-flash}" \
    COSMOS_CONNECTION_STRING="$COSMOS_CONNECTION_STRING" \
    COSMOS_DATABASE="${COSMOS_DATABASE:-chatbot}" \
    COSMOS_CONTAINER="${COSMOS_CONTAINER:-conversations}" \
    NODE_ENV="production" \
    SCM_DO_BUILD_DURING_DEPLOYMENT="true" \
  --output none

echo "==> Configuring startup..."
az webapp config set \
  --name "$APP_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --startup-file "node server/index.js" \
  --output none

echo "==> Deploying application..."
az webapp deploy \
  --name "$APP_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --src-path deploy.zip \
  --type zip

echo ""
echo "Live at: https://${APP_NAME}.azurewebsites.net"
