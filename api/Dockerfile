FROM node:20-alpine AS builder

RUN apk add --no-cache openssl libc6-compat

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/
RUN npm config set fetch-retry-maxtimeout 120000 && npm config set fetch-retries 5 && npm ci
RUN npx prisma generate

COPY . .
RUN npm run build

FROM node:20-alpine AS runner

RUN apk add --no-cache openssl libc6-compat

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/
RUN npm config set fetch-retry-maxtimeout 120000 && npm config set fetch-retries 5 \
  && npm ci --omit=dev \
  && npm install prisma@^5.22.0 --no-save
RUN npx prisma generate

COPY --from=builder /app/dist ./dist

ENV NODE_ENV=production
ENV PORT=4000
ENV UPLOAD_DIR=/data/uploads

RUN mkdir -p /data/uploads

EXPOSE 4000

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main"]