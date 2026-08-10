# Hostinger KVM 2 deployment alongside an existing n8n container

This is the recommended production layout when n8n already runs in Docker on the VPS. LuxEngine uses its own Docker Compose project, volumes, images, and environment files. It does not modify, recreate, or join the n8n Compose project.

## Final layout

- `https://luxengine.io` and `https://www.luxengine.io` route to the LuxEngine web container.
- `https://proxy.luxengine.io` routes to the authenticated Python proxy container.
- Existing n8n containers and their data remain unchanged.
- Convex remains the managed production backend.
- Clerk, Gemini, Resend, Twilio, and configured model providers remain external services.
- LuxEngine publishes ports `3000` and `8082` only on `127.0.0.1`.
- Only the existing reverse proxy publishes ports `80` and `443` publicly.

Do not combine the n8n and LuxEngine Compose files. Separate projects prevent a LuxEngine update or `--remove-orphans` operation from stopping n8n.

## 1. Inspect and back up the existing VPS

SSH to the VPS. Before changing anything, record the current Docker and port layout:

```bash
sudo docker compose ls
sudo docker ps --format 'table {{.Names}}\t{{.Image}}\t{{.Ports}}\t{{.Status}}'
sudo docker network ls
sudo ss -lntp | grep -E ':(80|443|3000|5678|8082)\b' || true
sudo df -h
sudo free -h
```

Find the n8n Compose directory. Replace `N8N_CONTAINER` with its container name from the previous command:

```bash
sudo docker inspect N8N_CONTAINER \
  --format '{{ index .Config.Labels "com.docker.compose.project.working_dir" }}'
```

Back up the n8n Compose file, its environment file, its database, and its persistent volume before proceeding. The correct database backup depends on whether n8n uses SQLite or PostgreSQL. Do not rely only on copying a live database file.

Determine what owns public HTTPS:

- If `nginx` owns ports 80/443, use **Path A: host Nginx** below.
- If `docker-proxy` owns ports 80/443, identify the reverse-proxy container:

```bash
sudo docker ps --format 'table {{.Names}}\t{{.Image}}\t{{.Ports}}' \
  | grep -E '0\.0\.0\.0:(80|443)|\[::\]:(80|443)'
```

Use **Path B: container reverse proxy** for Nginx Proxy Manager, Traefik, or Caddy.

- If nothing owns ports 80/443, use Path A and install Nginx.

Stop here if ports `3000` or `8082` are already occupied. Change the host-side LuxEngine port mappings before continuing; do not stop an unknown service.

## 2. Configure DNS

In the DNS zone for `luxengine.io`, create or verify:

| Type  | Name    | Value                   |
| ----- | ------- | ----------------------- |
| A     | `@`     | VPS public IPv4 address |
| CNAME | `www`   | `luxengine.io`          |
| A     | `proxy` | VPS public IPv4 address |

Do not change the existing n8n DNS record. Wait until all three LuxEngine names resolve to the VPS before requesting certificates.

## 3. Verify Docker Compose

n8n already proves that Docker Engine is installed. Verify the current installation instead of reinstalling it:

```bash
sudo docker version
sudo docker compose version
sudo systemctl is-active docker
```

If `docker compose version` fails, install the official Compose plugin for the existing Docker Engine. Do not uninstall Docker or remove `/var/lib/docker`, because that contains the n8n containers and volumes.

## 4. Create the LuxEngine service account and directories

```bash
id luxengine >/dev/null 2>&1 || sudo useradd --create-home --shell /bin/bash luxengine
sudo install -d -m 0755 -o luxengine -g luxengine /opt/luxengine
sudo install -d -m 0750 -o root -g luxengine /etc/luxengine
sudo install -d -m 0750 -o 10001 -g 10001 /var/lib/luxengine
sudo install -d -m 0700 -o 10001 -g 10001 /var/lib/luxengine/agent_workspace
sudo install -d -m 0700 -o 10001 -g 10001 /var/lib/luxengine/service-home
```

UID/GID `10001` matches the non-root user inside the LuxEngine containers.

## 5. Clone the repository

```bash
sudo -u luxengine -H git clone https://github.com/MarcP1001/LuxEngine.git /opt/luxengine
git -C /opt/luxengine rev-parse HEAD
```

If the repository becomes private, use a read-only deploy key. Do not put a personal access token in a command or clone URL.

## 6. Configure the Python proxy

```bash
sudo cp /opt/luxengine/.env.example /etc/luxengine/proxy.env
sudo chown root:luxengine /etc/luxengine/proxy.env
sudo chmod 0640 /etc/luxengine/proxy.env
sudoedit /etc/luxengine/proxy.env
```

At minimum:

- replace `ANTHROPIC_AUTH_TOKEN="freecc"` with a long random token;
- configure at least one provider API key matching `MODEL`;
- configure Discord or Telegram only if those integrations are required;
- keep raw payload, raw CLI, and diagnostic logging disabled;
- do not add n8n credentials to this file.

Generate the proxy token with:

```bash
openssl rand -hex 32
```

The Compose file supplies `HOST`, `PORT`, `HOME`, `CLAUDE_CLI_BIN`, and `CLAUDE_WORKSPACE` explicitly.

## 7. Configure Convex production

Create or select the production deployment in the Convex dashboard. Set the application values in that production deployment:

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

Create a production deploy key, store it temporarily, and deploy the Convex functions from an ephemeral Node container:

```bash
sudo install -m 0600 /dev/null /root/convex-deploy.env
sudoedit /root/convex-deploy.env
# Add: CONVEX_DEPLOY_KEY=prod:replace_me

sudo docker run --rm \
  --env-file /root/convex-deploy.env \
  --mount type=bind,src=/opt/luxengine/lux-engine,dst=/source,readonly \
  --workdir /work \
  node:22-alpine \
  sh -lc 'cp -a /source/. /work/ && npm ci && npx convex deploy'

sudo shred -u /root/convex-deploy.env
```

Record the production `https://...convex.cloud` URL. Convex recommends a production deployment for production traffic; local development deployments are not production replacements.

## 8. Configure Clerk production

In Clerk:

1. Use a production instance.
2. Add `luxengine.io` and `www.luxengine.io` as application domains.
3. Add the production OAuth callback URLs shown by Clerk.
4. Create the Convex JWT template.
5. Put its issuer in `CLERK_JWT_ISSUER_DOMAIN` in Convex.
6. Use only `pk_live_...` and `sk_live_...` keys on the VPS.

## 9. Configure the web container

```bash
sudo cp /opt/luxengine/deploy/web.env.example /etc/luxengine/web.env
sudo chown root:luxengine /etc/luxengine/web.env
sudo chmod 0640 /etc/luxengine/web.env
sudoedit /etc/luxengine/web.env
```

Replace every placeholder. `NEXT_PUBLIC_*` values are embedded into the web image during its build, so rebuild the image when they change.

## 10. Choose reverse-proxy integration

### Path A: host Nginx owns ports 80/443

No additional Compose configuration is needed. LuxEngine remains reachable by host Nginx at:

- `127.0.0.1:3000`
- `127.0.0.1:8082`

Continue to step 11, then configure Nginx in step 13A.

### Path B: a container proxy owns ports 80/443

Find the external Docker network used by that reverse proxy:

```bash
sudo docker inspect REVERSE_PROXY_CONTAINER \
  --format '{{range $name, $_ := .NetworkSettings.Networks}}{{println $name}}{{end}}'
```

Choose the proxy's existing network, then create:

```bash
sudo install -m 0640 -o root -g luxengine /dev/null /etc/luxengine/proxy-network.env
sudoedit /etc/luxengine/proxy-network.env
```

Add exactly one line:

```text
PROXY_NETWORK=replace_with_existing_proxy_network
```

The update script will automatically include `compose.proxy-network.yml`. On that shared network, configure the existing proxy to target:

- `luxengine-web:3000` for `luxengine.io` and `www.luxengine.io`;
- `luxengine-proxy:8082` for `proxy.luxengine.io`.

Do not publish a second reverse proxy on ports 80/443. For Nginx Proxy Manager, create two Proxy Hosts and request certificates in its UI. For Traefik or Caddy, add routers/sites using the same targets and existing certificate mechanism.

## 11. Validate and build the LuxEngine stack

The commands below do not reference the n8n Compose file and therefore cannot treat n8n as an orphan.

For Path A:

```bash
cd /opt/luxengine
sudo docker compose \
  --env-file /etc/luxengine/web.env \
  --file deploy/compose.yml \
  config --quiet

sudo env COMPOSE_PARALLEL_LIMIT=1 docker compose \
  --env-file /etc/luxengine/web.env \
  --file deploy/compose.yml \
  build --pull

sudo docker compose \
  --env-file /etc/luxengine/web.env \
  --file deploy/compose.yml \
  up --detach --wait
```

For Path B, add both the network environment file and override:

```bash
cd /opt/luxengine
sudo docker compose \
  --env-file /etc/luxengine/web.env \
  --env-file /etc/luxengine/proxy-network.env \
  --file deploy/compose.yml \
  --file deploy/compose.proxy-network.yml \
  config --quiet

sudo env COMPOSE_PARALLEL_LIMIT=1 docker compose \
  --env-file /etc/luxengine/web.env \
  --env-file /etc/luxengine/proxy-network.env \
  --file deploy/compose.yml \
  --file deploy/compose.proxy-network.yml \
  build --pull

sudo docker compose \
  --env-file /etc/luxengine/web.env \
  --env-file /etc/luxengine/proxy-network.env \
  --file deploy/compose.yml \
  --file deploy/compose.proxy-network.yml \
  up --detach --wait
```

If a KVM 2 build runs low on memory, confirm no n8n execution is active and add swap before retrying. Do not stop or recreate n8n merely to build LuxEngine.

## 12. Verify containers before enabling public traffic

```bash
sudo docker compose --file /opt/luxengine/deploy/compose.yml ps
sudo docker compose --file /opt/luxengine/deploy/compose.yml logs --tail 100 web proxy
curl --fail http://127.0.0.1:3000/api/health
curl --fail http://127.0.0.1:8082/health
sudo ss -lntp | grep -E ':(3000|8082)\b'
sudo docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'
```

Both LuxEngine services must be healthy, and their published addresses must start with `127.0.0.1`. Confirm n8n is still healthy before continuing.

## 13A. Configure host Nginx and HTTPS (Path A only)

Install the host packages only if they are not already installed:

```bash
sudo apt update
sudo apt install -y nginx certbot python3-certbot-nginx ufw
sudo install -d -m 0755 /var/www/certbot
```

Create a temporary HTTP-only site for certificate validation. This uses only the LuxEngine hostnames and does not replace an n8n Nginx site:

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

sudo ln -s /etc/nginx/sites-available/luxengine-bootstrap \
  /etc/nginx/sites-enabled/luxengine-bootstrap
sudo nginx -t
sudo systemctl reload nginx

sudo certbot certonly --webroot -w /var/www/certbot \
  --cert-name luxengine.io \
  -d luxengine.io -d www.luxengine.io -d proxy.luxengine.io
```

Install the production LuxEngine site without deleting any n8n site:

```bash
sudo cp /opt/luxengine/deploy/nginx-luxengine.conf \
  /etc/nginx/sites-available/luxengine
sudo ln -s /etc/nginx/sites-available/luxengine \
  /etc/nginx/sites-enabled/luxengine
sudo rm /etc/nginx/sites-enabled/luxengine-bootstrap
sudo nginx -t
sudo systemctl reload nginx
sudo systemctl enable --now certbot.timer
sudo certbot renew --dry-run
```

## 13B. Configure the existing container reverse proxy (Path B only)

Use the reverse proxy's existing management method and certificate storage. Create:

| Public hostname      | Internal target               |
| -------------------- | ----------------------------- |
| `luxengine.io`       | `http://luxengine-web:3000`   |
| `www.luxengine.io`   | `http://luxengine-web:3000`   |
| `proxy.luxengine.io` | `http://luxengine-proxy:8082` |

Enable WebSocket support for the web target, preserve the original `Host` header, pass `X-Forwarded-Proto`, and allow a five-minute read timeout on the proxy target. Request certificates for all three names through the existing proxy.

## 14. Firewall verification

If using host Nginx:

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
sudo ufw status verbose
```

If using a container reverse proxy, preserve its existing firewall setup. In both paths, do not add public rules for 3000 or 8082. Docker can bypass normal UFW handling for publicly published container ports, which is why the Compose file explicitly binds them to `127.0.0.1`.

## 15. Verify production end to end

```bash
curl --fail https://luxengine.io/api/health
curl --fail https://www.luxengine.io/api/health
curl --fail https://proxy.luxengine.io/health
curl -I http://luxengine.io
sudo docker compose --file /opt/luxengine/deploy/compose.yml ps
sudo docker ps --format 'table {{.Names}}\t{{.Status}}'
```

Expected results:

- HTTP redirects to HTTPS;
- both LuxEngine health endpoints succeed;
- LuxEngine ports 3000 and 8082 are bound only to localhost;
- n8n remains running and its existing URL still works;
- only the reverse proxy accepts public HTTP/HTTPS traffic.

Complete a real Clerk sign-in, listing synchronization, AI generation, property-site publication, lead submission, and authenticated proxy request before announcing launch.

## 16. Install the update and rollback command

```bash
sudo install -m 0750 -o root -g luxengine \
  /opt/luxengine/deploy/update-hostinger.sh /usr/local/sbin/update-luxengine
sudo update-luxengine
```

The script updates only the `luxengine` Compose project. Record the current commit before every update:

```bash
git -C /opt/luxengine rev-parse HEAD
```

Rollback to a known commit:

```bash
sudo LUXENGINE_REF=COMMIT_SHA update-luxengine
```

Return to `main` later:

```bash
sudo update-luxengine
```

## 17. Backups and routine maintenance

- Continue the existing n8n database and volume backups.
- Back up `/etc/luxengine`, `/var/lib/luxengine`, and the reverse-proxy certificate/configuration data.
- Test restoration, not only backup creation.
- Update n8n and LuxEngine as separate Compose projects.
- Review `docker system df` regularly; do not run broad prune commands while an image may be needed for rollback.
- Run the n8n security audit after n8n upgrades.

## Customer-owned property domains

Application routing alone is not enough for a customer hostname. Each approved customer domain also needs DNS validation, a matching TLS certificate, and a reverse-proxy route to the LuxEngine web container. Until certificate issuance is automated, add customer domains individually. Never serve them through a catch-all certificate that does not match the hostname.
