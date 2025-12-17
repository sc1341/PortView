# Docker Setup

## Quick Start

### Start the Container

```bash
./start.sh
```

Or use docker-compose directly:

```bash
docker-compose up -d --build
```

### Stop the Container

```bash
./stop.sh
```

Or:

```bash
docker-compose down
```

### Restart

```bash
./restart.sh
```

## Access

The application will be available at: **http://localhost:3000**

## View Logs

```bash
docker logs -f portview
```

## Manual Commands

```bash
# Build
docker-compose build

# Start
docker-compose up -d

# Stop
docker-compose stop

# Remove
docker-compose down
```
