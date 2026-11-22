# FileShare on files.zaforiq.me (manual VPS deploy)

FileShare runs on the same Azure VM as the portfolio site. **Portfolio nginx** terminates TLS and routes `files.zaforiq.me` to the FileShare containers.

## Architecture

| Host | Backend |
|------|---------|
| `https://files.zaforiq.me/` | `fileshare-web` (Next.js :3000) |
| `https://files.zaforiq.me/api/*` | `fileshare-api` (NestJS :4000) |

Containers must share the **portfolio** Docker network (default: `portfolio_default`) so `portfolio-nginx` can reach them.

---

## 1. DNS

Add an **A record**:

- **Name:** `files`
- **Value:** `4.252.0.112` (same IP as `zaforiq.me`)

Wait until it resolves before requesting TLS.

---

## 2. TLS certificate (on the VPS)

After DNS propagates, issue a cert for the subdomain (nginx must be able to serve HTTP or you use webroot).

**Option A — webroot** (portfolio nginx already on :80/:443):

```bash
sudo certbot certonly --webroot -w /var/www/html \
  -d files.zaforiq.me \
  --email YOUR_EMAIL \
  --agree-tos --non-interactive
```

If webroot is not configured, use **Option B** briefly stop nginx on :80, then standalone:

```bash
cd ~/portfolio
docker compose -f docker-compose.prod.yml stop nginx
sudo certbot certonly --standalone \
  -d files.zaforiq.me \
  --email YOUR_EMAIL \
  --agree-tos --non-interactive
docker compose -f docker-compose.prod.yml start nginx
```

Certs should appear under `/etc/letsencrypt/live/files.zaforiq.me/`.

---

## 3. Portfolio nginx

In the **zafor-portfolio** repo, `nginx/nginx.conf` includes `files.zaforiq.me` server blocks. Deploy on the VPS:

```bash
cd ~/portfolio
git pull --ff-only origin main
docker exec portfolio-nginx nginx -t
docker exec portfolio-nginx nginx -s reload
```

If the nginx container was recreated, ensure the Let’s Encrypt volume mount is unchanged (`/etc/letsencrypt:/etc/letsencrypt:ro` in `docker-compose.prod.yml`).

---

## 4. Clone FileShare and configure env

```bash
cd ~
git clone <your-fileshare-repo-url> fileshare
cd fileshare
cp .env.example .env
```

Edit `.env`:

- `POSTGRES_PASSWORD` — strong random password
- `JWT_SECRET` — long random string
- `ENCRYPTION_KEY` — exactly **64 hex characters** (32 bytes); changing it after data exists breaks decrypting stored credentials
- Leave `CORS_ORIGIN=https://files.zaforiq.me` and `NEXT_PUBLIC_API_URL=https://files.zaforiq.me/api` unless you use another domain

---

## 5. Confirm Docker network name

```bash
docker network ls | grep portfolio
```

You should see `portfolio_default` (created when portfolio Compose is up). If the name differs, set `networks.portfolio_default.name` in `docker-compose.prod.yml` to match.

---

## 6. Build and start FileShare

```bash
cd ~/fileshare
docker compose -f docker-compose.prod.yml up -d --build
```

Check logs:

```bash
docker compose -f docker-compose.prod.yml logs -f api
docker compose -f docker-compose.prod.yml ps
```

The API runs `prisma migrate deploy` on startup.

---

## 7. Verify

```bash
curl -fsS https://files.zaforiq.me/api/health
curl -I https://files.zaforiq.me/
curl -fsS https://zaforiq.me/api/portfolio
```

Open `https://files.zaforiq.me` in a browser — register a user (do not use default dev secrets in production).

---

## 8. Updates (manual)

```bash
cd ~/fileshare
git pull
docker compose -f docker-compose.prod.yml up -d --build
```

If only nginx changed in portfolio:

```bash
cd ~/portfolio
git pull
docker exec portfolio-nginx nginx -t && docker exec portfolio-nginx nginx -s reload
```

---

## Troubleshooting

| Issue | Check |
|-------|--------|
| 502 from nginx | `docker ps` — are `fileshare-web` / `fileshare-api` running? Same network as `portfolio-nginx`? |
| API DB errors | `docker compose -f docker-compose.prod.yml logs postgres api` |
| CORS errors | `CORS_ORIGIN` must match `https://files.zaforiq.me` exactly |
| Large upload fails | nginx `client_max_body_size` is `100m` for this host in portfolio `nginx.conf` |
| Cert path errors | `sudo ls /etc/letsencrypt/live/files.zaforiq.me/` inside the VM |