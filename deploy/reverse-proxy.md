# Production Reverse Proxy Setup (Nginx & Caddy)

To run the LuxEngine proxy securely over the internet or inside a local intranet, it is highly recommended to place it behind a reverse proxy like **Nginx** or **Caddy**. This handles SSL certificates (HTTPS) and secures access.

---

## 1. Nginx Configuration

Create a new Nginx site configuration (e.g., `/etc/nginx/sites-available/free-claude-code`) and insert the following template:

```nginx
server {
    listen 80;
    server_name proxy.yourdomain.com;

    # Redirect HTTP traffic to HTTPS
    location / {
        return 301 https://$host$request_uri;
    }
}

server {
    listen 443 ssl http2;
    server_name proxy.yourdomain.com;

    # SSL Certificate Config (Certbot / Let's Encrypt recommended)
    ssl_certificate /etc/letsencrypt/live/proxy.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/proxy.yourdomain.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    # Standard security headers
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;

    # Route requests to LuxEngine proxy (local port 8082)
    location / {
        proxy_pass http://127.0.0.1:8082;
        proxy_http_version 1.1;

        # Mandatory headers for WebSockets / SSE (Server-Sent Events) streaming
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Disable buffering to allow real-time response streaming
        proxy_buffering off;
        proxy_cache off;
        chunked_transfer_encoding on;

        # Timeouts for long LLM reasoning steps
        proxy_read_timeout 300s;
        proxy_send_timeout 300s;
    }
}
```

Enable the configuration and reload Nginx:
```bash
sudo ln -s /etc/nginx/sites-available/free-claude-code /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## 2. Caddy Configuration

If you prefer **Caddy** (which automatically provisions and renews Let's Encrypt SSL certificates), insert the following simple configuration block into your `/etc/caddy/Caddyfile`:

```caddy
proxy.yourdomain.com {
    # Route traffic to LuxEngine
    reverse_proxy 127.0.0.1:8082 {
        # Enable streaming support (disable response buffering)
        header_up Host {host}
        header_up X-Real-IP {remote}
        header_up X-Forwarded-Proto {scheme}
    }

    # Timeouts for streaming LLM calls
    transport http {
        dial_timeout 10s
        response_header_timeout 300s
        read_timeout 300s
    }

    log {
        output file /var/log/caddy/proxy_access.log
    }
}
```

Reload Caddy to apply changes:
```bash
sudo systemctl reload caddy
```
