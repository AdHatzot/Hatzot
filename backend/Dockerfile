# Build stage
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package lock and package manifest
COPY package.json package-lock.json ./

# Install dependencies (including devDependencies needed for build)
RUN npm ci

# Copy TypeScript configuration and source code
COPY tsconfig.json ./
COPY src ./src

# Build TypeScript output to dist/
RUN npm run build

# Production runner stage
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

COPY package.json package-lock.json ./

# Install production dependencies only
RUN npm ci --only=production

# Copy compiled JavaScript output from builder stage
COPY --from=builder /app/dist ./dist

EXPOSE 3000

CMD ["node", "dist/index.js"]
