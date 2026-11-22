FROM node:20-bookworm-slim AS builder

RUN apt-get update -y && apt-get install -y --no-install-recommends \
    openssl \
    ca-certificates \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/
RUN npm config set fetch-retry-maxtimeout 120000 && npm config set fetch-retries 5 \
  && npm ci --no-audit --no-fund
RUN npx prisma generate

COPY . .
RUN npm run build && npm prune --production

FROM node:20-bookworm-slim AS runner

RUN apt-get update -y && apt-get install -y --no-install-recommends \
    openssl \
    ca-certificates \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4000
ENV UPLOAD_DIR=/data/uploads

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

RUN mkdir -p /data/uploads

EXPOSE 4000

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main"]