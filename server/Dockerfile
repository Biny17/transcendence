FROM oven/bun:slim

WORKDIR /app/server

COPY server/package.json ./
RUN bun install --frozen-lockfile

COPY server ./server
COPY shared ./shared

EXPOSE 3002

CMD ["bun", "dev"]# start
