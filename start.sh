#!/bin/bash

set -e

echo "🔍 Starting PortView..."

if ! docker info > /dev/null 2>&1; then
    echo "❌ Error: Docker is not running"
    exit 1
fi

if docker ps --format '{{.Names}}' | grep -q "^portview$"; then
    echo "✅ Container is already running!"
    echo "🌐 Access at: http://localhost:3000"
    exit 0
fi

if docker ps -a --format '{{.Names}}' | grep -q "^portview$"; then
    echo "🔄 Starting existing container..."
    docker start portview
else
    echo "🏗️  Building and starting container..."
    docker-compose up -d --build
fi

sleep 2

if docker ps --format '{{.Names}}' | grep -q "^portview$"; then
    echo "✅ Running at: http://localhost:3000"
else
    echo "❌ Failed to start. Check logs: docker logs portview"
    exit 1
fi

