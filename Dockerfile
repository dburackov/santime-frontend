# syntax=docker/dockerfile:1

# ---------- deps ----------
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ---------- build ----------
FROM node:22-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# NEXT_PUBLIC_* инлайнятся компилятором прямо в бандл, поэтому задать их через
# environment в compose нельзя — только здесь, до сборки.
ARG NEXT_PUBLIC_SITE_URL
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL

# Флаг читает next.config.ts: включает output: 'standalone'.
ENV BUILD_STANDALONE=1
RUN npm run build

# ---------- runtime ----------
FROM node:22-alpine AS runtime
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
# Без этого standalone-сервер слушает только localhost внутри контейнера и nginx до него не достучится.
ENV HOSTNAME=0.0.0.0

RUN addgroup -g 1001 -S nodejs && adduser -u 1001 -S nextjs -G nodejs

# standalone намеренно не включает в себя статику и public (расчёт на CDN),
# поэтому обе директории копируются отдельно — иначе страницы придут без CSS и JS.
COPY --from=build --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=build --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=build --chown=nextjs:nodejs /app/public ./public

# Точка монтирования тома с ISR-кэшем. Создать и отдать пользователю нужно здесь:
# том при первом монтировании наследует владельца существующей директории образа,
# и без chown Next молча не сможет писать кэш.
RUN mkdir -p .next/cache && chown -R nextjs:nodejs .next

USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
