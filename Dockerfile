# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --legacy-peer-deps

COPY . .

# Build frontend
RUN npx vite build

# Build server
RUN npx tsc -p tsconfig.server.json

# Stage 2: Production
FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --legacy-peer-deps --omit=dev

# Copy built frontend
COPY --from=builder /app/dist/client ./dist/client

# Copy built server
COPY --from=builder /app/dist/server ./dist/server

# Copy shared types (needed at runtime for constants)
COPY --from=builder /app/src/shared ./src/shared

ENV NODE_ENV=production
ENV PORT=8080

EXPOSE 8080

CMD ["node", "dist/server/index.js"]
