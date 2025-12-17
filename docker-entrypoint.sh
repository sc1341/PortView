#!/bin/sh
set -e

# Ensure data directory exists and is writable (ephemeral - data is lost when container is deleted)
mkdir -p /app/data
chmod 777 /app/data 2>/dev/null || true

# Start Node.js API server
exec node server/index.js
