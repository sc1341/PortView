#!/bin/sh
set -e

# Ensure data directory exists and is writable
mkdir -p /app/data
chmod 777 /app/data 2>/dev/null || true

# Start Node.js API server
exec node server/index.js
