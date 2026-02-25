# ─── Stage 1: Build ──────────────────────────────────────
FROM node:20-alpine AS build

WORKDIR /app

# Copy lockfile + workspace package.json files first (layer caching)
COPY package.json package-lock.json ./
COPY packages/schema/package.json packages/schema/
COPY packages/generator/package.json packages/generator/
COPY packages/editor/package.json packages/editor/
COPY packages/cli/package.json packages/cli/

RUN npm ci --ignore-scripts

# Copy shared tsconfig (schema + generator extend it)
COPY tsconfig.base.json ./

# Copy source code
COPY packages/schema/ packages/schema/
COPY packages/generator/ packages/generator/
COPY packages/editor/ packages/editor/

# Build in dependency order: schema → generator → editor
RUN npm run build -w packages/schema && \
    npm run build -w packages/generator && \
    npm run build -w packages/editor

# ─── Stage 2: Serve ──────────────────────────────────────
FROM node:20-alpine

LABEL org.opencontainers.image.title="Gyxer Studio" \
      org.opencontainers.image.description="Visual backend builder — design and generate NestJS APIs" \
      org.opencontainers.image.url="https://github.com/Gyxer513/gyxer-studio" \
      org.opencontainers.image.source="https://github.com/Gyxer513/gyxer-studio"

WORKDIR /app

# Copy the lightweight server (zero npm deps)
COPY docker/serve.mjs ./serve.mjs

# Copy built editor files
COPY --from=build /app/packages/editor/dist ./editor-dist

# Persistent volume for saved configs
RUN mkdir -p /data/configs
VOLUME /data/configs

ENV PORT=4200
ENV CONFIGS_DIR=/data/configs
ENV NODE_ENV=production

EXPOSE 4200

CMD ["node", "serve.mjs"]
