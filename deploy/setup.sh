#!/bin/bash
# Algorhythm — DigitalOcean Droplet Setup Script
# Tested on Ubuntu 24.04 LTS
# Run as root or with sudo

set -e

echo "━━━ 1/7 Updating system ━━━"
apt-get update && apt-get upgrade -y

echo "━━━ 2/7 Installing base packages ━━━"
apt-get install -y nginx curl wget ufw git python3 python3-pip python3-venv unzip

echo "━━━ 3/7 Installing Node.js 20 (for building frontend) ━━━"
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

echo "━━━ 4/7 Installing PocketBase ━━━"
mkdir -p /opt/pocketbase
cd /opt/pocketbase
if [ ! -f pocketbase ]; then
  PB_VERSION="0.22.14"
  wget -q "https://github.com/pocketbase/pocketbase/releases/download/v${PB_VERSION}/pocketbase_${PB_VERSION}_linux_amd64.zip"
  unzip -q "pocketbase_${PB_VERSION}_linux_amd64.zip"
  rm "pocketbase_${PB_VERSION}_linux_amd64.zip"
  chmod +x pocketbase
fi

echo "━━━ 5/7 Setting up firewall ━━━"
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

echo "━━━ 6/7 Creating app directory ━━━"
mkdir -p /var/www/algorhythm
mkdir -p /opt/algorhythm-api

echo "━━━ 7/7 Next steps ━━━"
cat <<EOF

✓ System ready. Now:

1. Clone your repo:
   cd /opt/algorhythm-api && git clone https://github.com/YOUR_USERNAME/DSA-VISU.git .

2. Build the frontend:
   cd /opt/algorhythm-api
   npm install
   # Create .env.production with VITE_POCKETBASE_URL=https://your-domain.com
   npm run build
   cp -r dist/* /var/www/algorhythm/

3. Set up Python backend:
   cd /opt/algorhythm-api
   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt fastapi uvicorn

4. Install systemd services:
   cp deploy/pocketbase.service /etc/systemd/system/
   cp deploy/algorhythm-api.service /etc/systemd/system/
   systemctl daemon-reload
   systemctl enable --now pocketbase
   systemctl enable --now algorhythm-api

5. Install nginx config:
   cp deploy/nginx.conf /etc/nginx/sites-available/algorhythm
   ln -s /etc/nginx/sites-available/algorhythm /etc/nginx/sites-enabled/
   rm -f /etc/nginx/sites-enabled/default
   nginx -t && systemctl reload nginx

6. Create PocketBase admin:
   /opt/pocketbase/pocketbase --dir=/opt/pocketbase/pb_data admin create you@example.com YourPassword

7. Set up Cloudflare Tunnel for free HTTPS:
   See deploy/README.md
EOF
