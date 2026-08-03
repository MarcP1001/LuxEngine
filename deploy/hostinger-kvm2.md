# Hostinger KVM 2 production deployment

This deployment runs both applications from this repository on one Ubuntu VPS:

- `https://luxengine.io` and `https://www.luxengine.io` → Next.js on `127.0.0.1:3000`
- `https://proxy.luxengine.io` → authenticated Python proxy on `127.0.0.1:8082`
- Convex remains the managed production database/backend.

Only ports 22, 80, and 443 are public. Never expose ports 3000 or 8082 through the VPS firewall.

## 1. DNS and Hostinger setup

Use Ubuntu 24.04 LTS (or Hostinger's current Node.js Ubuntu template). In the DNS zone, create:

| Type  | Name    | Value                   |
| ----- | ------- | ----------------------- |
| A     | `@`     | VPS public IPv4 address |
| CNAME | `www`   | `luxengine.io`          |
| A     | `proxy` | VPS public IPv4 address |

Wait for all three names to resolve before requesting certificates.

## 2. Create the service account and install packages

SSH to the VPS as a sudo-capable user, then run:

```bash
sudo apt update
sudo apt upgrade -y
sudo apt install -y ca-certificates curl git gnupg nginx openssl certbot python3-certbot-nginx ufw

curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs

sudo install -d -m 0755 /etc/apt/keyrings
sudo curl -fsSL https://downloads.claude.ai/keys/claude-code.asc \
  -o /etc/apt/keyrings/claude-code.asc
gpg --show-keys /etc/apt/keyrings/claude-code.asc
# Verify fingerprint: 31DD DE24 DDFA B679 F42D 7BD2 BAA9 29FF 1A7E CACE
echo "deb [signed-by=/etc/apt/keyrings/claude-code.asc] https://downloads.claude.ai/claude-code/apt/stable stable main" \
  | sudo tee /etc/apt/sources.list.d/claude-code.list
sudo apt update
sudo apt install -y claude-code

sudo useradd --create-home --shell /bin/bash luxengine
sudo install -d -o luxengine -g luxengine /opt/luxengine
sudo install -d -m 0750 -o root -g luxengine /etc/luxengine
sudo install -d -m 0755 /var/www/certbot
```

Install `uv` and Python 3.14 for the service account:

```bash
sudo -u luxengine -H bash -c 'curl -LsSf https://astral.sh/uv/install.sh | sh'
sudo -u luxengine -H /home/luxengine/.local/bin/uv self update
sudo -u luxengine -H /home/luxengine/.local/bin/uv python install 3.14
```

Verify the versions:

```bash
node --version
npm --version
sudo -u luxengine -H /home/luxengine/.local/bin/uv --version
```

## 3. Clone the repository

For this public repository:

```bash
sudo -u luxengine -H git clone https://github.com/MarcP1001/LuxEngine.git /opt/luxengine
sudo install -d -m 0750 -o luxengine -g luxengine /var/lib/luxengine
sudo install -d -m 0700 -o luxengine -g luxengine /var/lib/luxengine/agent_workspace
sudo install -d -m 0700 -o luxengine -g luxengine /var/lib/luxengine/service-home
```

If the repository becomes private, use a read-only deploy key instead of placing a personal token in a command or URL.

## 4. Configure the Python proxy

```bash
sudo cp /opt/luxengine/.env.example /etc/luxengine/proxy.env
sudo chown root:luxengine /etc/luxengine/proxy.env
sudo chmod 0640 /etc/luxengine/proxy.env
sudoedit /etc/luxengine/proxy.env
```

At minimum:

- replace `ANTHROPIC_AUTH_TOKEN="freecc"` with a long random value;
- configure at least one provider API key matching `MODEL`;
- set Discord or Telegram credentials if messaging is enabled;
- set `CLAUDE_WORKSPACE=/var/lib/luxengine/agent_workspace`;
- set `CLAUDE_CLI_BIN=/usr/bin/claude`;
- keep raw payload and diagnostic logging disabled.

Generate a proxy token without printing it into shell history:

```bash
openssl rand -hex 32
```

Install the Python application:

```bash
sudo -u luxengine -H /home/luxengine/.local/bin/uv sync \
  --project /opt/luxengine --python 3.14 --no-dev
```

## 5. Configure Convex production

Create or select the production deployment in the Convex dashboard. Set these values in that production deployment, not in the VPS web environment:

```text
CLERK_JWT_ISSUER_DOMAIN
SUPERADMIN_EMAILS
MASTER_IDX_KEY
GEMINI_API_KEY
GEMINI_MODEL
RESEND_API_KEY
RESEND_FROM_EMAIL
TWILIO_ACCOUNT_SID
TWILIO_AUTH_TOKEN
TWILIO_PHONE_NUMBER
LUXENGINE_CANONICAL_HOST=luxengine.io
LUXENGINE_PLATFORM_HOSTS=luxengine.io,www.luxengine.io
```

Create a production deploy key in Convex, put it in a temporary root-readable file, deploy, and then remove that file:

```bash
sudo install -m 0600 /dev/null /root/convex-deploy.env
sudoedit /root/convex-deploy.env
# Add: CONVEX_DEPLOY_KEY=prod:replace_me

sudo bash -c 'set -a; source /root/convex-deploy.env; set +a; cd /opt/luxengine/lux-engine; npx convex deploy'
sudo shred -u /root/convex-deploy.env
```

Record the resulting production `https://...convex.cloud` URL.

## 6. Configure Clerk production

In Clerk:

1. Use a production instance.
2. Add `luxengine.io` and `www.luxengine.io` as allowed application domains.
3. Add the production OAuth callback URLs shown by Clerk for those domains.
4. Create the Convex JWT template and copy its issuer URL into `CLERK_JWT_ISSUER_DOMAIN` in Convex.
5. Use only `pk_live_...` and `sk_live_...` keys on the VPS.

## 7. Configure and build the web application

```bash
sudo cp /opt/luxengine/deploy/web.env.example /etc/luxengine/web.env
sudo chown root:luxengine /etc/luxengine/web.env
sudo chmod 0640 /etc/luxengine/web.env
sudoedit /etc/luxengine/web.env
```

Replace every placeholder with the production Convex URL and Clerk keys. Then build with the same environment that systemd will use:

```bash
sudo -u luxengine -H bash -c '
  set -a
  source /etc/luxengine/web.env
  set +a
  cd /opt/luxengine/lux-engine
  npm ci
  npm audit --omit=dev --audit-level=critical
  npm run build
'
```

`NEXT_PUBLIC_*` values are embedded during the build. Rebuild whenever either public value changes.

## 8. Install and start both systemd services

```bash
sudo cp /opt/luxengine/deploy/free-claude-code.service /etc/systemd/system/
sudo cp /opt/luxengine/deploy/lux-engine-web.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now free-claude-code.service lux-engine-web.service

sudo systemctl status free-claude-code.service lux-engine-web.service
curl --fail http://127.0.0.1:8082/health
curl --fail http://127.0.0.1:3000/api/health
```

View logs with:

```bash
sudo journalctl -u free-claude-code.service -u lux-engine-web.service -f
```

## 9. Configure Nginx and HTTPS

Create a temporary HTTP-only site so Certbot can validate all names:

```bash
sudo tee /etc/nginx/sites-available/luxengine-bootstrap >/dev/null <<'NGINX'
server {
    listen 80;
    listen [::]:80;
    server_name luxengine.io www.luxengine.io proxy.luxengine.io;
    location /.well-known/acme-challenge/ { root /var/www/certbot; }
    location / { return 200 "TLS bootstrap\n"; }
}
NGINX

sudo ln -s /etc/nginx/sites-available/luxengine-bootstrap /etc/nginx/sites-enabled/luxengine-bootstrap
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx

sudo certbot certonly --webroot -w /var/www/certbot \
  --cert-name luxengine.io \
  -d luxengine.io -d www.luxengine.io -d proxy.luxengine.io
```

Install the production configuration:

```bash
sudo cp /opt/luxengine/deploy/nginx-luxengine.conf /etc/nginx/sites-available/luxengine
sudo ln -s /etc/nginx/sites-available/luxengine /etc/nginx/sites-enabled/luxengine
sudo rm -f /etc/nginx/sites-enabled/luxengine-bootstrap
sudo nginx -t
sudo systemctl reload nginx
sudo systemctl enable --now certbot.timer
sudo certbot renew --dry-run
```

## 10. Configure the firewall

Confirm SSH works before enabling UFW:

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
sudo ufw status verbose
```

Do not add rules for 3000 or 8082.

## 11. Verify production

```bash
curl --fail https://luxengine.io/api/health
curl --fail https://www.luxengine.io/api/health
curl --fail https://proxy.luxengine.io/health
curl -I http://luxengine.io
sudo ss -lntp | grep -E ':(80|443|3000|8082)\b'
```

Expected:

- HTTP redirects to HTTPS;
- both health endpoints return `status: healthy`;
- ports 3000 and 8082 listen only on `127.0.0.1`;
- ports 80 and 443 listen publicly through Nginx.

Complete a real Clerk sign-in, listing synchronization, AI generation, property-site publication, lead submission, and proxy request before announcing the launch.

## 12. Updates and rollback

Install the update script:

```bash
sudo install -m 0750 -o root -g luxengine \
  /opt/luxengine/deploy/update-hostinger.sh /usr/local/sbin/update-luxengine
sudo update-luxengine
```

Before updating, record the current commit:

```bash
git -C /opt/luxengine rev-parse HEAD
```

To roll back, replace `COMMIT_SHA` with a known-good commit and rebuild:

```bash
sudo LUXENGINE_REF=COMMIT_SHA update-luxengine
```

Return to the normal update track afterward:

```bash
sudo update-luxengine
```

## Customer-owned domains

The application can route a configured customer domain after its CNAME points to `luxengine.io`, but Nginx must also possess a certificate for that hostname. Until automated certificate issuance is implemented, add each approved domain explicitly with Certbot and an Nginx server block. Do not expose an HTTPS catch-all with a mismatched certificate.
