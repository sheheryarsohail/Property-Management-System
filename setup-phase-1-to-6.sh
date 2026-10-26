#!/bin/bash
set -e

echo "========================================================================"
echo "🚀 PMS Automated Deployment Setup (Phases 1 to 6)"
echo "Domain configured: ssestateandmarketing.com"
echo "========================================================================"

# Ensure NVM / Node / pnpm / pm2 are in PATH if installed in ~/.nvm
export NVM_DIR="$HOME/.nvm"
if [ -s "$NVM_DIR/nvm.sh" ]; then
  . "$NVM_DIR/nvm.sh"
fi

echo "🔍 Checking Phase 1 Prerequisites (Docker, Node.js, PNPM, PM2)..."

# 1. Check Docker
if ! command -v docker &> /dev/null; then
  echo "❌ Docker is not installed. Installing docker.io & docker-compose-v2 via sudo apt..."
  sudo apt update && sudo apt install -y docker.io docker-compose-v2
fi

# 2. Check Node.js / NVM
if ! command -v node &> /dev/null; then
  echo "📦 Node.js not found. Installing NVM and Node.js 20 LTS..."
  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
  export NVM_DIR="$HOME/.nvm"
  . "$NVM_DIR/nvm.sh"
  nvm install 20
  nvm use 20
  nvm alias default 20
fi

echo "Node version: $(node -v)"
echo "NPM version: $(npm -v)"

# 3. Check PNPM
if ! command -v pnpm &> /dev/null; then
  echo "📦 Installing PNPM..."
  npm install -g pnpm
fi
echo "PNPM version: $(pnpm -v)"

# 4. Check PM2
if ! command -v pm2 &> /dev/null; then
  echo "📦 Installing PM2..."
  npm install -g pm2
fi
echo "PM2 version: $(pm2 -v)"

echo "✅ All Phase 1 Prerequisites are installed and ready!"

# Phase 3: Start Docker Infrastructure Containers
echo "========================================================================"
echo "🐳 Phase 3: Starting PostgreSQL, Redis, and MinIO S3 via Docker Compose..."
echo "========================================================================"
docker compose up -d postgres redis minio minio-init

echo "⏳ Waiting 5 seconds for PostgreSQL & Redis containers..."
sleep 5
docker compose ps

# Phase 4: Database Migrations & Seeding
echo "========================================================================"
echo "🗄️ Phase 4: Installing Node dependencies, generating Prisma & seeding DB..."
echo "========================================================================"
echo "📦 Installing workspace packages with pnpm..."
pnpm install

echo "⚙️ Generating Prisma ORM client..."
pnpm run prisma:generate

echo "🛠️ Applying database migrations (non-interactive deploy)..."
pnpm --filter @pms/api exec prisma migrate deploy --schema src/prisma/schema.prisma

echo "🌱 Seeding initial admin account (admin@local.dev / dummy)..."
pnpm --filter @pms/api prisma:seed || echo "⚠️ Seed already ran or completed with existing data."

# Phase 5: Build Production Bundles
echo "========================================================================"
echo "🏗️ Phase 5: Building Production Bundles for ssestateandmarketing.com..."
echo "========================================================================"
echo "Building NestJS API..."
pnpm --filter @pms/api build

echo "Building NestJS Worker..."
pnpm --filter @pms/worker build

echo "Building Next.js Web Frontend (with API URL: https://api.ssestateandmarketing.com)..."
pnpm --filter @pms/web build

# Phase 6: PM2 Process Management
echo "========================================================================"
echo "⚡ Phase 6: Launching Applications under PM2 Process Manager..."
echo "========================================================================"
pm2 start ecosystem.config.js
pm2 save
pm2 status

echo "========================================================================"
echo "🎉 SUCCESS! Phases 1 to 6 are complete!"
echo "• Backend API running on Port 3001"
echo "• Frontend Web running on Port 3002"
echo "• Configured for Custom Domain: ssestateandmarketing.com"
echo "========================================================================"
