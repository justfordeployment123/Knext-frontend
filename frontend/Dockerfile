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

# Production stage - Frontend only
FROM nginx:alpine

# Install wget for healthcheck
RUN apk add --no-cache wget

# Copy built frontend files
COPY --from=frontend-build /app/build /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 7481 for nginx (matches nginx.conf)
EXPOSE 7481 

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
