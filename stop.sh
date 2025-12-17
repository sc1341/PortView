#!/bin/bash

set -e

echo "🛑 Stopping PortView..."

if ! docker ps -a --format '{{.Names}}' | grep -q "^portview$"; then
    echo "ℹ️  Container does not exist"
    exit 0
fi

if docker ps --format '{{.Names}}' | grep -q "^portview$"; then
    docker stop portview
    echo "✅ Stopped"
else
    echo "ℹ️  Already stopped"
fi

