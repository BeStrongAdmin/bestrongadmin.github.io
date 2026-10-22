# ==========================================
# Stage 1: Build the Angular Application
# ==========================================
FROM node:20-alpine AS build

WORKDIR /app

# Copy package descriptors
COPY package*.json ./

# Install dependencies cleanly
RUN npm ci

# Copy source code
COPY . .

# Build for production
RUN npm run build -- --configuration production

# ==========================================
# Stage 2: Serve with Lightweight Nginx Alpine
# ==========================================
FROM nginx:alpine

# Remove default nginx static assets
RUN rm -rf /usr/share/nginx/html/*

# Copy build artifacts from previous stage
COPY --from=build /app/dist/bestrong-admin/browser /usr/share/nginx/html

# Copy custom nginx configuration for SPA routing
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
