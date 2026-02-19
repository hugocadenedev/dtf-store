#!/bin/bash
# ═══════════════════════════════════════════════════════════════════
# DTF Store — Deploy Script
# Run this on your VPS to deploy or update the application
# ═══════════════════════════════════════════════════════════════════
set -e

echo "🚀 DTF Store — Deploying..."

# ─── 1. Pull latest code ─────────────────────────────────────────
echo "📥 Pulling latest code..."
git pull origin dev

# ─── 2. Check .env.production exists ─────────────────────────────
if [ ! -f .env.production ]; then
    echo "❌ .env.production not found!"
    echo "   Copy .env.example to .env.production and fill in your values:"
    echo "   cp .env.example .env.production"
    exit 1
fi

# ─── 3. Create required directories ──────────────────────────────
echo "📁 Creating data directories..."
mkdir -p data uploads
# Ensure nextjs user (uid 1001) can write to data & uploads
chown -R 1001:1001 data uploads

# ─── 4. Build & start containers ─────────────────────────────────
echo "🐳 Building and starting Docker containers..."
docker compose build --no-cache

# ─── 5. Run database migrations ──────────────────────────────────
echo "🗄️  Running database migrations..."
docker compose run --rm migrator
# Fix DB file permissions after migration (created as root)
chown -R 1001:1001 data

# ─── 6. Start app ────────────────────────────────────────────────
echo "🚀 Starting application..."
docker compose up -d app

# ─── 6. Health check ─────────────────────────────────────────────
echo "🏥 Checking app health..."
sleep 5
if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 | grep -q "200"; then
    echo "✅ App is running successfully!"
else
    echo "⚠️  App may still be starting up. Check logs with: docker compose logs -f app"
fi

echo ""
echo "═══════════════════════════════════════════════════"
echo "  Deployment complete!"
echo "  App:  http://localhost:3000"
echo "  Logs: docker compose logs -f"
echo "═══════════════════════════════════════════════════"
