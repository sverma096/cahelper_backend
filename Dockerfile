# ─── Stage 1: Builder ───────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files and install production dependencies only
COPY package.json ./
RUN npm install --omit=dev

# ─── Stage 2: Runtime ───────────────────────────────────────────────────────
FROM node:20-alpine

# Install system dependencies required by sharp and tesseract.js
RUN apk add --no-cache \
    vips-dev \
    tesseract-ocr \
    tesseract-ocr-data-eng \
    python3 \
    make \
    g++

WORKDIR /app

# Copy installed node_modules from builder stage
COPY --from=builder /app/node_modules ./node_modules

# Copy application source
COPY . .

# Create a non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

# Expose the app port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:5000/ || exit 1

# Start the server
CMD ["node", "server.js"]
