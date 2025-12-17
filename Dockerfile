# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

# Copy source code
COPY . .

# Build the frontend
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install production dependencies only
RUN npm ci --only=production && \
    npm cache clean --force

# Copy built frontend from builder
COPY --from=builder /app/dist ./dist

# Copy server files
COPY server ./server

# Copy utils needed by server (nmapParser)
COPY src/utils/nmapParser.js ./src/utils/nmapParser.js

# Copy entrypoint script
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Expose port 3000
EXPOSE 3000

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Use entrypoint to ensure data directory exists
ENTRYPOINT ["/docker-entrypoint.sh"]
