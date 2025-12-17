#!/bin/bash

set -e

echo "🔄 Restarting PortView..."

if docker ps --format '{{.Names}}' | grep -q "^portview$"; then
    docker stop portview
fi

docker start portview
sleep 2

if docker ps --format '{{.Names}}' | grep -q "^portview$"; then
    echo "✅ Restarted at: http://localhost:3000"
else
    echo "❌ Failed. Check logs: docker logs portview"
    exit 1
fi

