#!/bin/bash
# ═══════════════════════════════════════════════════════════════════
# DTF Store — Initial VPS Setup
# Run this ONCE on a fresh Ubuntu/Debian VPS
# Usage: chmod +x scripts/setup-vps.sh && sudo ./scripts/setup-vps.sh
# ═══════════════════════════════════════════════════════════════════
set -e

DOMAIN=${1:-"YOUR_DOMAIN.com"}

echo "🖥️  DTF Store — VPS Setup"
echo "   Domain: $DOMAIN"
echo ""

# ─── 1. Update system ────────────────────────────────────────────
echo "📦 Updating system packages..."
apt update && apt upgrade -y

# ─── 2. Install Docker ───────────────────────────────────────────
if ! command -v docker &>/dev/null; then
    echo "🐳 Installing Docker..."
    curl -fsSL https://get.docker.com | sh
    systemctl enable docker
    systemctl start docker
    # Add current user to docker group
    usermod -aG docker $SUDO_USER 2>/dev/null || true
else
    echo "✅ Docker already installed"
fi

# ─── 3. Install Docker Compose ───────────────────────────────────
if ! command -v docker compose &>/dev/null; then
    echo "🐳 Installing Docker Compose..."
    apt install -y docker-compose-plugin
else
    echo "✅ Docker Compose already installed"
fi

# ─── 4. Install Git ──────────────────────────────────────────────
if ! command -v git &>/dev/null; then
    echo "📦 Installing Git..."
    apt install -y git
else
    echo "✅ Git already installed"
fi

# ─── 5. Firewall ─────────────────────────────────────────────────
echo "🔒 Configuring firewall..."
apt install -y ufw
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

# ─── 6. Clone repo ───────────────────────────────────────────────
APP_DIR="/opt/dtf-store"
if [ ! -d "$APP_DIR" ]; then
    echo "📥 Cloning repository..."
    git clone https://github.com/hugocadenedev/dtf-store.git $APP_DIR
    cd $APP_DIR
    git checkout dev
else
    echo "✅ Repository already cloned at $APP_DIR"
    cd $APP_DIR
    git pull origin dev
fi

# ─── 7. Setup env file ───────────────────────────────────────────
if [ ! -f .env.production ]; then
    echo "📝 Creating .env.production from template..."
    cp .env.example .env.production
    # Generate JWT secret
    JWT=$(openssl rand -base64 32)
    sed -i "s|CHANGE_ME_TO_A_STRONG_RANDOM_SECRET|$JWT|g" .env.production
    sed -i "s|YOUR_DOMAIN.com|$DOMAIN|g" .env.production
    echo ""
    echo "⚠️  IMPORTANT: Edit .env.production with your Stripe keys:"
    echo "   nano $APP_DIR/.env.production"
fi

# ─── 8. Update Nginx config with domain ──────────────────────────
echo "🌐 Configuring Nginx for $DOMAIN..."
sed -i "s|YOUR_DOMAIN.com|$DOMAIN|g" nginx/conf.d/default.conf

# ─── 9. Create data directories ──────────────────────────────────
mkdir -p data uploads certbot/conf certbot/www

# ─── 10. SSL Certificate ─────────────────────────────────────────
echo ""
echo "═══════════════════════════════════════════════════"
echo "  VPS Setup complete!"
echo ""
echo "  Next steps:"
echo "  1. Edit your env file:  nano $APP_DIR/.env.production"
echo "  2. Point DNS A record for $DOMAIN to this server IP"
echo "  3. Get SSL cert:  ./scripts/init-ssl.sh $DOMAIN"
echo "  4. Deploy:        ./scripts/deploy.sh"
echo "═══════════════════════════════════════════════════"
