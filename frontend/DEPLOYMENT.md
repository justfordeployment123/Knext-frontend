# Docker Deployment Guide

This guide explains how to deploy the KaNeXT IQ™ platform with both frontend and backend using Docker.

## Docker Setup

The Dockerfile includes:
- ✅ React frontend build
- ✅ Node.js backend server
- ✅ Nginx web server
- ✅ Supervisor process manager
- ✅ API proxy configuration

## Quick Start

### Build and Run with Docker Compose

```bash
# Build and start containers
docker-compose up -d

# View logs
docker-compose logs -f

# Stop containers
docker-compose down
```

### Build and Run with Docker

```bash
# Build the image
docker build -t kanext-iq .

# Run the container
docker run -d \
  -p 7481:7481 \
  -p 3001:3001 \
  -e JWT_SECRET=your-super-secret-jwt-key-min-32-chars \
  -e FRONTEND_URL=http://localhost:7481 \
  -v $(pwd)/backend/data:/app/backend/data \
  --name kanext-iq \
  kanext-iq

# View logs
docker logs -f kanext-iq

# Stop container
docker stop kanext-iq
```

## Environment Variables

Create a `.env` file or set environment variables:

```env
JWT_SECRET=your-super-secret-jwt-key-min-32-chars-change-in-production
FRONTEND_URL=http://localhost:7481
PORT=3001
```

## Ports

- **7481**: Frontend (Nginx) - Main application
- **3001**: Backend API - Direct backend access (optional)

## API Endpoints

When deployed, the frontend automatically proxies `/api/*` requests to the backend:

- Frontend: `http://localhost:7481`
- API: `http://localhost:7481/api/*` (proxied to backend)
- Direct Backend: `http://localhost:3001/api/*` (if port 3001 is exposed)

## Data Persistence

Backend data is stored in `backend/data/users.json`. To persist data:

```bash
# Mount volume
-v $(pwd)/backend/data:/app/backend/data
```

## Health Checks

Backend health check endpoint:
```bash
curl http://localhost:7481/api/health
```

## Troubleshooting

### Backend not starting
```bash
# Check backend logs
docker logs kanext-iq | grep backend

# Check supervisor status
docker exec kanext-iq supervisorctl status
```

### Frontend not loading
```bash
# Check nginx logs
docker logs kanext-iq | grep nginx

# Check nginx status
docker exec kanext-iq supervisorctl status nginx
```

### API requests failing
- Ensure backend is running: `curl http://localhost:3001/api/health`
- Check nginx proxy configuration
- Verify CORS settings in backend

## Production Considerations

1. **Change JWT_SECRET**: Use a strong, random secret (minimum 32 characters)
2. **Use HTTPS**: Configure SSL/TLS certificates
3. **Database**: Replace JSON file storage with MongoDB/PostgreSQL
4. **Environment Variables**: Use secrets management
5. **Monitoring**: Add logging and monitoring tools
6. **Backup**: Regular backups of `backend/data` directory

## Docker Compose Production Example

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "7481:7481"
    environment:
      - JWT_SECRET=${JWT_SECRET}
      - FRONTEND_URL=https://yourdomain.com
    volumes:
      - ./backend/data:/app/backend/data
    restart: always
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:3001/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
```

