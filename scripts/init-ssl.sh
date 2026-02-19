#!/bin/bash
# ═══════════════════════════════════════════════════════════════════
# DTF Store — Initialize SSL with Let's Encrypt
# Usage: chmod +x scripts/init-ssl.sh && ./scripts/init-ssl.sh your-domain.com
# ═══════════════════════════════════════════════════════════════════
set -e

DOMAIN=${1:?"Usage: ./scripts/init-ssl.sh <domain>"}
EMAIL=${2:-"admin@$DOMAIN"}

echo "🔐 Setting up SSL for $DOMAIN..."

# ─── 1. Temporarily start nginx without SSL ──────────────────────
# Create a temporary config for HTTP-only
cat > nginx/conf.d/default.conf <<EOF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 200 'SSL setup in progress...';
        add_header Content-Type text/plain;
    }
}
EOF

echo "🌐 Starting Nginx for ACME challenge..."
docker compose up -d nginx

sleep 3

# ─── 2. Request certificate ──────────────────────────────────────
echo "📜 Requesting SSL certificate..."
docker compose run --rm certbot certonly \
    --webroot \
    --webroot-path=/var/www/certbot \
    --email $EMAIL \
    --agree-tos \
    --no-eff-email \
    -d $DOMAIN \
    -d www.$DOMAIN

# ─── 3. Restore full Nginx config ────────────────────────────────
echo "🔄 Restoring full Nginx config..."
git checkout nginx/conf.d/default.conf
sed -i "s|YOUR_DOMAIN.com|$DOMAIN|g" nginx/conf.d/default.conf

# ─── 4. Restart Nginx with SSL ───────────────────────────────────
docker compose restart nginx

echo ""
echo "✅ SSL certificate installed for $DOMAIN!"
echo "   Certificate will auto-renew via the certbot container."
