#!/bin/bash
# Quick deployment script for server
# Run this from the monorepo root

echo "🚀 Deploying Server to Vercel..."

# Build the server first
echo "📦 Building server..."
npx nx build server

cd apps/server

# Check if vercel is installed
if ! command -v vercel &> /dev/null
then
    echo "❌ Vercel CLI not found. Installing..."
    npm install -g vercel
fi

# Deploy
vercel --prod

echo "✅ Server deployment complete!"
