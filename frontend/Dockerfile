# Build stage - Frontend
FROM node:18-alpine AS frontend-build

WORKDIR /app

# Copy frontend package files
COPY package*.json ./

# Install frontend dependencies
RUN npm install --legacy-peer-deps

# Copy frontend source code
COPY public ./public
COPY src ./src

# Build the React app
RUN npm run build

# Backend dependencies stage
FROM node:18-alpine AS backend-deps

WORKDIR /app/backend

# Copy backend package files
COPY backend/package*.json ./

# Install backend dependencies
RUN npm install --production

# Production stage
FROM node:18-alpine

# Install nginx, supervisor, and wget (for health checks)
RUN apk add --no-cache nginx supervisor wget

WORKDIR /app

# Copy backend dependencies
COPY --from=backend-deps /app/backend/node_modules ./backend/node_modules

# Copy backend source code
COPY backend/server.js ./backend/
COPY backend/start.sh ./backend/
COPY backend/package.json ./backend/

# Make startup script executable
RUN chmod +x /app/backend/start.sh

# Create backend data directory
RUN mkdir -p /app/backend/data

# Copy built frontend files
COPY --from=frontend-build /app/build /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy supervisor configuration
RUN echo '[supervisord]' > /etc/supervisord.conf && \
    echo 'nodaemon=true' >> /etc/supervisord.conf && \
    echo '' >> /etc/supervisord.conf && \
    echo '[program:backend]' >> /etc/supervisord.conf && \
    echo 'command=/app/backend/start.sh' >> /etc/supervisord.conf && \
    echo 'directory=/app/backend' >> /etc/supervisord.conf && \
    echo 'autostart=true' >> /etc/supervisord.conf && \
    echo 'autorestart=true' >> /etc/supervisord.conf && \
    echo 'stderr_logfile=/var/log/backend.err.log' >> /etc/supervisord.conf && \
    echo 'stdout_logfile=/var/log/backend.out.log' >> /etc/supervisord.conf && \
    echo '' >> /etc/supervisord.conf && \
    echo '[program:nginx]' >> /etc/supervisord.conf && \
    echo 'command=nginx -g "daemon off;"' >> /etc/supervisord.conf && \
    echo 'autostart=true' >> /etc/supervisord.conf && \
    echo 'autorestart=true' >> /etc/supervisord.conf && \
    echo 'stderr_logfile=/var/log/nginx.err.log' >> /etc/supervisord.conf && \
    echo 'stdout_logfile=/var/log/nginx.out.log' >> /etc/supervisord.conf

# Create nginx directories
RUN mkdir -p /var/log/nginx && \
    mkdir -p /var/lib/nginx && \
    mkdir -p /run/nginx

# Expose ports
EXPOSE 7481 3001

# Start supervisor (runs both backend and nginx)
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisord.conf"]

