# --- Build ---
FROM node:20-alpine AS build
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@10.17.1 --activate

# workspace metadata
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY tsconfig*.json ./
COPY apps/worker/package.json apps/worker/package.json

# install deps for workspace (dev deps for build)
RUN pnpm -r install --frozen-lockfile --prod=false

# sources
COPY apps ./apps

# ✅ Generate Prisma client here too if the worker imports @prisma/client
#    (uses the same schema as the API)
RUN pnpm -w exec prisma generate --schema apps/api/src/prisma/schema.prisma

# compile just the worker
RUN pnpm -w exec tsc -p apps/worker/tsconfig.json

# --- Runtime ---
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Prisma runtime libs on Alpine (OpenSSL 3 + libstdc++)
RUN apk add --no-cache openssl libstdc++

COPY --from=build /app /app
WORKDIR /app/apps/worker

# prefer dist/main.js; fallback to dist/index.js
CMD ["sh","-lc","[ -f dist/main.js ] && node dist/main.js || node dist/index.js"]
