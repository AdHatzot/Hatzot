# Build stage
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package lock and package manifest
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci

# Copy configuration files and source code
COPY index.html tsconfig.json vite.config.ts postcss.config.js tailwind.config.ts .eslintrc.cjs ./
COPY public ./public
COPY src ./src

# Build argument for Vite map tile URL
ARG VITE_MAP_TILE_URL
ENV VITE_MAP_TILE_URL=${VITE_MAP_TILE_URL}

# Build static assets to dist/
RUN npm run build

# Production runner stage using Nginx
FROM nginx:alpine AS runner

# Copy custom Nginx configuration for SPA routing & proxying
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy static build output from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
