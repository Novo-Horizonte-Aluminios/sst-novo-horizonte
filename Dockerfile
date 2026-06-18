FROM node:22-alpine AS builder

WORKDIR /app

# Copy package files first for layer caching
COPY package*.json ./

# Install ALL dependencies (including devDeps needed for build)
RUN npm ci

# Copy source code
COPY . .

# Build: generates dist/ with frontend assets + dist/server.cjs
RUN npm run build

# ---- Production image ----
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --omit=dev

# Copy built artifacts from builder
COPY --from=builder /app/dist ./dist

EXPOSE 3000

# Run the Express server
CMD ["node", "dist/server.cjs"]
