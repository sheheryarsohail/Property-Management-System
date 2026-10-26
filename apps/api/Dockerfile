# --- build ---
FROM node:20-bookworm-slim AS build
WORKDIR /app

# tools for node-gyp & TLS during build
RUN apt-get update && apt-get install -y --no-install-recommends \
  python3 build-essential ca-certificates openssl \
  && rm -rf /var/lib/apt/lists/*

RUN corepack enable && corepack prepare pnpm@10.17.1 --activate

# cache-friendly copies
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY tsconfig*.json ./
COPY apps/api/package.json apps/api/package.json

# install workspace deps (dev deps included for build)
RUN pnpm -r install --frozen-lockfile --prod=false

# bring in sources
COPY apps ./apps

# ensure local package symlinks are restored after sources copy
RUN pnpm --filter @pms/api install --prod=false --offline

# ✅ Generate Prisma client from the real schema location
RUN pnpm -w exec prisma generate --schema apps/api/src/prisma/schema.prisma

# build just the API
RUN pnpm --filter @pms/api run build

# --- runtime ---
FROM node:20-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production

# Prisma runtime libs on Debian 12
RUN apt-get update && apt-get install -y --no-install-recommends \
    libssl3 ca-certificates libstdc++6 curl \
  && rm -rf /var/lib/apt/lists/*

# copy built workspace
COPY --from=build /app /app

WORKDIR /app

# prefer Nest build output; fallback to legacy paths
CMD ["sh","-lc","if [ -f dist/apps/api/main.js ]; then node -r reflect-metadata dist/apps/api/main.js; elif [ -f dist/main.js ]; then node -r reflect-metadata dist/main.js; elif [ -f dist/src/main.js ]; then node -r reflect-metadata dist/src/main.js; else echo '❌ dist output not found'; ls -R dist || true; exit 1; fi"]
