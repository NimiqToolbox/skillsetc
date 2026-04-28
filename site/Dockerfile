# syntax=docker/dockerfile:1.7

# ---------- 1. base ----------
FROM node:22-alpine AS base
WORKDIR /app
ENV NODE_ENV=production \
    ASTRO_TELEMETRY_DISABLED=1 \
    NPM_CONFIG_FUND=false \
    NPM_CONFIG_AUDIT=false

# ---------- 2. deps ----------
FROM base AS deps
COPY package.json package-lock.json* ./
RUN --mount=type=cache,target=/root/.npm \
    if [ -f package-lock.json ]; then npm ci; else npm install; fi

# ---------- 3. build ----------
FROM base AS build
ARG SITE_URL=http://localhost
ARG BASE_PATH=/
ENV SITE_URL=${SITE_URL} \
    BASE_PATH=${BASE_PATH}
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# ---------- 4. runtime (nginx) ----------
FROM nginx:1.27-alpine AS runtime
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s \
  CMD wget -q --spider http://127.0.0.1/ || exit 1
CMD ["nginx", "-g", "daemon off;"]
