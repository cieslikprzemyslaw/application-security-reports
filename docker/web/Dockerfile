# syntax=docker/dockerfile:1.7

FROM node:24-bookworm AS build

WORKDIR /app

COPY package.json package-lock.json ./
COPY scripts/configure-git-hooks.mjs ./scripts/configure-git-hooks.mjs

RUN --mount=type=secret,id=npmrc,target=/root/.npmrc,required=false \
    npm ci --no-audit --no-fund

COPY index.html ./
COPY tsconfig.json ./
COPY vite.config.ts ./
COPY src ./src

RUN npm run build:client


FROM nginxinc/nginx-unprivileged:stable-alpine AS runtime

COPY docker/web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
