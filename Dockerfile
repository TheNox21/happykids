# Use node Alpine image for lightweight footprint
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency configurations
COPY package*.json tsconfig.json vite.config.ts ./

# Install devDependencies and dependencies needed for building
RUN npm ci

# Copy all source code
COPY . .

# Compile Frontend (Vite) and Backend Server (esbuild)
RUN npm run build

# --- Production runner image ---
FROM node:20-alpine

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Copy built artifacts and production dependencies
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./

# Install only production dependencies (excluding devDependencies to shrink container footprint)
RUN npm ci --only=production

EXPOSE 3000

CMD ["node", "dist/server.cjs"]
