FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ARG NEXT_PUBLIC_BASE_PATH=""
ENV NEXT_PUBLIC_BASE_PATH=$NEXT_PUBLIC_BASE_PATH
RUN npm run build

FROM node:20-slim
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Install native binaries for glibc (node:20-slim) — the deps/builder stages use Alpine (musl)
# so their native .node files won't work here
COPY package*.json ./
RUN npm install --os=linux --cpu=x64 @napi-rs/canvas better-sqlite3 && \
    cp -r node_modules/@napi-rs ./node_modules/ 2>/dev/null || true && \
    cp -r node_modules/better-sqlite3 ./node_modules/ 2>/dev/null || true && \
    rm -rf package*.json

EXPOSE 3000
USER node
CMD ["node", "server.js"]
