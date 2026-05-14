FROM oven/bun:slim AS builder

WORKDIR /app

COPY front/package.json front/bun.lock ./
RUN bun install --frozen-lockfile

COPY front/ .
COPY shared ./shared
RUN bun run build

FROM oven/bun:slim

WORKDIR /app

COPY front/package.json front/bun.lock ./
RUN bun install --frozen-lockfile --production

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.ts ./next.config.ts

EXPOSE 3000

CMD ["bun", "run", "start"]
