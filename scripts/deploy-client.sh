#!/bin/bash
# Quick deployment script for client
# Run this from the monorepo root

echo "🚀 Deploying Client to Vercel..."
cd apps/client

# Check if vercel is installed
if ! command -v vercel &> /dev/null
then
    echo "❌ Vercel CLI not found. Installing..."
    npm install -g vercel
fi

# Deploy
vercel --prod

echo "✅ Client deployment complete!"
