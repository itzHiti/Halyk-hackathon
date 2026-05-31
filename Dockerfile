# syntax=docker/dockerfile:1
# Многостадийная сборка Next.js 16 (App Router, standalone output), пакетный менеджер — pnpm.

# ---- База: Node 22 (Next 16/React 19 требуют Node ≥ 20.9), pnpm через corepack ----
FROM node:22-alpine AS base
RUN corepack enable
WORKDIR /app

# ---- Зависимости (кешируется, пока не меняются манифесты) ----
FROM base AS deps
RUN apk add --no-cache libc6-compat
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# ---- Сборка ----
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# ВАЖНО: переменные NEXT_PUBLIC_* инлайнятся в клиентский бандл на этапе сборки,
# поэтому адрес бэкенда задаётся build-arg'ом (для другого URL образ нужно пересобрать).
ARG NEXT_PUBLIC_API_URL=http://localhost:8000
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm build

# ---- Рантайм (минимальный образ из standalone-вывода) ----
FROM base AS runner
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Непривилегированный пользователь
RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

# Статика и самодостаточный сервер из standalone-сборки
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000

# standalone кладёт точку входа в server.js
CMD ["node", "server.js"]
