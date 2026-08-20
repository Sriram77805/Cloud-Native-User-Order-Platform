FROM node:22-alpine AS deps
WORKDIR /app
RUN apk update && apk upgrade --no-cache
COPY package*.json ./
RUN npm ci --omit=dev

FROM node:22-alpine
WORKDIR /app
RUN apk update && apk upgrade --no-cache

# Run as a non-root user instead of the container default root.
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Production image only runs `node server.js` - it never needs the npm
# CLI itself, and npm bundles its own dependencies (tar, glob, sigstore,
# minimatch, cross-spawn, etc.) that show up as vulnerabilities even
# though the running app never touches them.
RUN rm -rf /usr/local/lib/node_modules/npm /usr/local/bin/npm /usr/local/bin/npx /usr/local/bin/corepack

ENV PORT=5000
EXPOSE 5000

USER appuser

HEALTHCHECK --interval=10s --timeout=5s --start-period=10s --retries=5 \
  CMD wget -qO- http://localhost:5000/health/live || exit 1

CMD ["node", "server.js"]