# Build stage
FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production stage - nginxinc's unprivileged image runs as a non-root user
# and listens on 8080 by default, so `runAsNonRoot: true` in the k8s
# Deployment actually works (stock nginx:alpine needs root to bind :80).
FROM nginxinc/nginx-unprivileged:alpine

COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 8080

HEALTHCHECK --interval=10s --timeout=5s --start-period=10s --retries=5 \
  CMD wget -qO- http://localhost:8080/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
