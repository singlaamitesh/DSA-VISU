# Algorhythm — DigitalOcean Deployment Guide

Deploy Algorhythm to a **$6/mo DigitalOcean droplet** with:
- **Nginx** — serves React frontend + reverse-proxies API + PocketBase
- **PocketBase** — auth + database (single Go binary, 15MB)
- **FastAPI + LangGraph** — AI visualization backend
- **Cloudflare Tunnel** — free HTTPS without Let's Encrypt hassle

## 1. Create Droplet

- Ubuntu 24.04 LTS
- Basic plan, 1 GB RAM / 25 GB SSD ($6/mo)
- Choose closest region to your users
- Add your SSH key

## 2. Initial Setup

SSH in as root:
```bash
ssh root@YOUR_DROPLET_IP
```

Clone and run setup:
```bash
git clone https://github.com/YOUR_USER/DSA-VISU.git /opt/algorhythm-api
cd /opt/algorhythm-api
bash deploy/setup.sh
```

## 3. Build Frontend

```bash
cd /opt/algorhythm-api
npm install

# Create production env
cat > .env.production <<EOF
VITE_POCKETBASE_URL=/pb
EOF

npm run build
cp -r dist/* /var/www/algorhythm/
```

## 4. Python Backend

```bash
cd /opt/algorhythm-api
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Create backend env
cat > .env <<EOF
OPENROUTER_API_KEY=sk-or-your-key
OPENROUTER_MODEL=google/gemini-2.5-flash
POCKETBASE_URL=http://127.0.0.1:8090
FRONTEND_URL=https://your-domain.com
EOF
```

## 5. Install Services

```bash
cp deploy/pocketbase.service /etc/systemd/system/
cp deploy/algorhythm-api.service /etc/systemd/system/
systemctl daemon-reload
systemctl enable --now pocketbase
systemctl enable --now algorhythm-api

# Verify
systemctl status pocketbase
systemctl status algorhythm-api
```

## 6. Configure Nginx

```bash
cp deploy/nginx.conf /etc/nginx/sites-available/algorhythm
ln -sf /etc/nginx/sites-available/algorhythm /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx
```

## 7. Create PocketBase Admin

```bash
/opt/pocketbase/pocketbase --dir=/opt/pocketbase/pb_data admin create you@example.com YourStrongPassword
```

Access admin at: `http://YOUR_DROPLET_IP/pb/_/`

## 8. Create `generations` Collection

In PocketBase admin:
1. Click **Collections → New collection → Base**
2. Name: `generations`
3. Add fields:
   - `user` (Relation → users, required)
   - `prompt` (Text, required, max 2000)
   - `html` (Text, required, max 1000000)
4. Set API rules:
   - List/View: `user = @request.auth.id`
   - Create: `@request.auth.id != ""`
   - Delete: `user = @request.auth.id`

## 9. Free HTTPS via Cloudflare Tunnel

1. Add your domain to Cloudflare (free plan)
2. Install cloudflared:
   ```bash
   wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
   dpkg -i cloudflared-linux-amd64.deb
   ```
3. Login and create tunnel:
   ```bash
   cloudflared tunnel login
   cloudflared tunnel create algorhythm
   cloudflared tunnel route dns algorhythm your-domain.com
   ```
4. Create `/etc/cloudflared/config.yml`:
   ```yaml
   tunnel: YOUR_TUNNEL_ID
   credentials-file: /root/.cloudflared/YOUR_TUNNEL_ID.json
   ingress:
     - hostname: your-domain.com
       service: http://localhost:80
     - service: http_status:404
   ```
5. Install as service:
   ```bash
   cloudflared service install
   systemctl enable --now cloudflared
   ```

Done. Visit `https://your-domain.com`.

## Updating

```bash
cd /opt/algorhythm-api
git pull
npm install && npm run build
cp -r dist/* /var/www/algorhythm/
source venv/bin/activate && pip install -r requirements.txt
systemctl restart algorhythm-api
```

## Monitoring

```bash
# Logs
tail -f /var/log/pocketbase.log
tail -f /var/log/algorhythm-api.log
journalctl -u nginx -f

# Service status
systemctl status pocketbase algorhythm-api nginx
```

## Backup PocketBase

```bash
# Simple daily backup
tar czf /root/pb-backup-$(date +%Y%m%d).tar.gz /opt/pocketbase/pb_data
```
