FROM node:22-alpine AS dependencies

WORKDIR /app
RUN apk add --no-cache libc6-compat
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-alpine AS builder

WORKDIR /app
COPY --from=dependencies /app/node_modules ./node_modules
COPY . .

ARG NEXT_PUBLIC_CONVEX_URL
ARG NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
ARG NEXT_PUBLIC_CANONICAL_HOST=luxengine.io
ENV NEXT_PUBLIC_CONVEX_URL=$NEXT_PUBLIC_CONVEX_URL \
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=$NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY \
    NEXT_PUBLIC_CANONICAL_HOST=$NEXT_PUBLIC_CANONICAL_HOST \
    CLERK_SECRET_KEY=sk_test_build-placeholder

RUN test -n "$NEXT_PUBLIC_CONVEX_URL" \
    && test -n "$NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY" \
    && npm run build

FROM node:22-alpine AS runner

ENV NODE_ENV=production \
    HOSTNAME=0.0.0.0 \
    PORT=3000
WORKDIR /app

RUN addgroup -S -g 10001 luxengine \
    && adduser -S -D -H -u 10001 -G luxengine luxengine

COPY --from=builder --chown=luxengine:luxengine /app/public ./public
COPY --from=builder --chown=luxengine:luxengine /app/.next/standalone ./
COPY --from=builder --chown=luxengine:luxengine /app/.next/static ./.next/static

USER luxengine
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD wget -qO- http://127.0.0.1:3000/api/health >/dev/null || exit 1

CMD ["node", "server.js"]
