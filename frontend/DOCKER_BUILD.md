# Docker Build Instructions

## Quick Build & Run

### Option 1: Docker Compose (Recommended)

```bash
# Build and start
docker-compose up -d --build

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

### Option 2: Docker Build

```bash
# Build image
docker build -t kanext-iq:latest .

# Run container
docker run -d \
  --name kanext-iq \
  -p 7481:7481 \
  -p 3001:3001 \
  -e JWT_SECRET=your-super-secret-jwt-key-min-32-chars \
  -e FRONTEND_URL=http://localhost:7481 \
  -v $(pwd)/backend/data:/app/backend/data \
  kanext-iq:latest

# View logs
docker logs -f kanext-iq

# Stop container
docker stop kanext-iq
docker rm kanext-iq
```

## What's Included

The Docker image includes:
- ✅ React frontend (built and served via Nginx)
- ✅ Node.js backend API server
- ✅ Supervisor process manager (runs both services)
- ✅ Nginx reverse proxy (proxies `/api/*` to backend)
- ✅ Automatic restart on failure
- ✅ Health checks

## Architecture

```
┌─────────────────────────────────┐
│     Docker Container             │
│  ┌──────────┐  ┌─────────────┐  │
│  │  Nginx   │  │  Backend    │  │
│  │  :7481   │  │  :3001      │  │
│  └────┬─────┘  └──────┬──────┘  │
│       │                │         │
│       └──────┬──────────┘         │
│              │                   │
│       Supervisor (Process Mgr)   │
└──────────────┼───────────────────┘
               │
         Port 7481 (Public)
```

## Environment Variables

Set these in `docker-compose.yml` or as `-e` flags:

- `PORT` - Backend port (default: 3001)
- `JWT_SECRET` - Secret key for JWT (REQUIRED in production)
- `FRONTEND_URL` - Frontend URL for CORS (default: *)
- `NODE_ENV` - Environment (default: production)

## Testing

After deployment:

```bash
# Test frontend
curl http://localhost:7481

# Test backend health
curl http://localhost:7481/api/health

# Test backend directly (if port 3001 exposed)
curl http://localhost:3001/api/health
```

## Troubleshooting

### Check if services are running
```bash
docker exec kanext-iq supervisorctl status
```

### View backend logs
```bash
docker exec kanext-iq cat /var/log/backend.out.log
docker exec kanext-iq cat /var/log/backend.err.log
```

### View nginx logs
```bash
docker exec kanext-iq cat /var/log/nginx.out.log
docker exec kanext-iq cat /var/log/nginx.err.log
```

### Restart services
```bash
docker exec kanext-iq supervisorctl restart backend
docker exec kanext-iq supervisorctl restart nginx
```

### Shell into container
```bash
docker exec -it kanext-iq sh
```

## Production Deployment

1. **Set strong JWT_SECRET**:
   ```bash
   export JWT_SECRET=$(openssl rand -base64 32)
   ```

2. **Update docker-compose.yml** with production values

3. **Use volume for data persistence**:
   ```yaml
   volumes:
     - /path/to/persistent/storage:/app/backend/data
   ```

4. **Enable HTTPS** (use reverse proxy like Traefik or Caddy)

5. **Set up monitoring** (Prometheus, Grafana, etc.)

