# syntax=docker/dockerfile:1.7

ARG NODE_BUILD_IMAGE=node:24-bookworm
ARG NODE_RUNTIME_IMAGE=node:24-bookworm-slim

# ---------------------------------------------------------------------------
# Build
# Installs all dependencies, generates Prisma Client and compiles TypeScript.
# ---------------------------------------------------------------------------
FROM ${NODE_BUILD_IMAGE} AS build

WORKDIR /app

COPY package.json package-lock.json ./
COPY scripts/configure-git-hooks.mjs ./scripts/configure-git-hooks.mjs
COPY scripts/prisma-command.mjs ./scripts/prisma-command.mjs

RUN --mount=type=secret,id=npmrc,target=/root/.npmrc,required=false \
    npm ci

COPY tsconfig.server.json ./
COPY prisma.config.ts ./
COPY prisma ./prisma
COPY server ./server
COPY src/domain ./src/domain
COPY src/validation ./src/validation

RUN npm run db:generate
RUN npm run build:server

# ---------------------------------------------------------------------------
# Production dependencies
# Removes packages that are only required for building, testing and linting.
# ---------------------------------------------------------------------------
FROM node:24-bookworm AS production-dependencies

WORKDIR /app

COPY package.json package-lock.json ./
COPY scripts/configure-git-hooks.mjs ./scripts/configure-git-hooks.mjs

RUN --mount=type=secret,id=npmrc,target=/root/.npmrc,required=false \
    npm ci --omit=dev --no-audit --no-fund

FROM ${NODE_RUNTIME_IMAGE} AS migrate

ENV NODE_ENV=production

WORKDIR /app

RUN mkdir -p /data \
    && chown node:node /data

COPY --from=build --chown=node:node /app/package.json ./package.json
COPY --from=build --chown=node:node /app/package-lock.json ./package-lock.json
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/prisma.config.ts ./prisma.config.ts
COPY --from=build --chown=node:node /app/prisma ./prisma
COPY --from=build --chown=node:node /app/scripts/prisma-command.mjs ./scripts/prisma-command.mjs

USER node

CMD ["node", "scripts/prisma-command.mjs", "migrate", "deploy"]

# ---------------------------------------------------------------------------
# API runtime
# Contains only the compiled server and production dependencies.
# ---------------------------------------------------------------------------
FROM ${NODE_RUNTIME_IMAGE} AS runtime

ENV NODE_ENV=production

WORKDIR /app

RUN mkdir -p \
        /data \
        /app/uploads/company-logos \
        /app/uploads/evidence \
        /app/uploads/issuer-logos \
    && chown -R node:node /data /app

COPY --from=production-dependencies --chown=node:node \
    /app/node_modules ./node_modules

COPY --from=build --chown=node:node \
    /app/package.json ./package.json

COPY --from=build --chown=node:node \
    /app/dist-server ./dist-server

USER node

EXPOSE 3001

HEALTHCHECK \
    --interval=30s \
    --timeout=5s \
    --start-period=10s \
    --retries=3 \
    CMD node -e "fetch('http://127.0.0.1:' + (process.env.API_PORT || '3001') + '/api/health').then(response => process.exit(response.ok ? 0 : 1)).catch(() => process.exit(1))"

CMD ["node", "dist-server/server/index.js"]
