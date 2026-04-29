# TLS / HTTPS Setup Guide

This document describes how to configure TLS termination for VacciChain in production.

## Overview

VacciChain enforces HTTPS in production via:
- **TLS 1.2+ only** (TLS 1.0/1.1 disabled)
- **HTTP → HTTPS redirect** (301 permanent)
- **HSTS header** with 1-year max-age and includeSubDomains
- **Automatic certificate renewal** via Let's Encrypt / Certbot

## Prerequisites

- A registered domain name pointing to your server's public IP
- Ports 80 and 443 open in your firewall
- Docker and Docker Compose installed

## Option 1: Let's Encrypt (Recommended)

### Initial Certificate Issuance

1. **Update nginx.conf** with your domain:
   ```bash
   # Replace server_name _ with your actual domain
   sed -i 's/server_name _;/server_name vaccichain.example.com;/' frontend/nginx.conf
   ```

2. **Obtain certificate** (interactive):
   ```bash
   docker compose run --rm certbot certonly \
     --webroot \
     --webroot-path=/var/www/certbot \
     --email admin@example.com \
     --agree-tos \
     --no-eff-email \
     -d vaccichain.example.com
   ```

3. **Start services**:
   ```bash
   docker compose up -d
   ```

### Automatic Renewal

The `certbot` service runs a renewal check every 12 hours. Certificates are renewed automatically 30 days before expiry.

To force a renewal test:
```bash
docker compose exec certbot certbot renew --dry-run
```

### Certificate Locations

Certificates are stored in `./certs/` (mounted from `/etc/letsencrypt` in the certbot container):
- `./certs/live/<domain>/fullchain.pem` → nginx `ssl_certificate`
- `./certs/live/<domain>/privkey.pem` → nginx `ssl_certificate_key`

Update `frontend/nginx.conf` if your paths differ:
```nginx
ssl_certificate     /etc/nginx/certs/live/vaccichain.example.com/fullchain.pem;
ssl_certificate_key /etc/nginx/certs/live/vaccichain.example.com/privkey.pem;
```

## Option 2: Custom Certificates

If using your own PKI or a commercial CA:

1. **Place certificates** in `./certs/`:
   ```
   ./certs/
   ├── fullchain.pem  # Certificate + intermediate chain
   └── privkey.pem    # Private key
   ```

2. **Set permissions**:
   ```bash
   chmod 600 ./certs/privkey.pem
   chmod 644 ./certs/fullchain.pem
   ```

3. **Update docker-compose.yml** to remove the certbot service (optional).

4. **Start services**:
   ```bash
   docker compose up -d
   ```

## Option 3: Cloud Load Balancer

If deploying behind AWS ALB, GCP Load Balancer, or Cloudflare:

1. **Configure TLS at the load balancer** (not in nginx).
2. **Update nginx.conf** to listen on port 80 only (remove the HTTPS server block).
3. **Trust X-Forwarded-Proto** header from the load balancer:
   ```nginx
   # In each proxy_pass location:
   proxy_set_header X-Forwarded-Proto $http_x_forwarded_proto;
   ```
4. **Verify HSTS** is set by the load balancer (or add it to nginx).

## Verification

### 1. Check HTTPS redirect
```bash
curl -I http://vaccichain.example.com
# Expected: HTTP/1.1 301 Moved Permanently
# Location: https://vaccichain.example.com/
```

### 2. Check TLS version
```bash
openssl s_client -connect vaccichain.example.com:443 -tls1_1
# Expected: handshake failure (TLS 1.1 disabled)

openssl s_client -connect vaccichain.example.com:443 -tls1_2
# Expected: successful connection
```

### 3. Check HSTS header
```bash
curl -I https://vaccichain.example.com
# Expected: Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
```

### 4. SSL Labs test
Visit [SSL Labs](https://www.ssllabs.com/ssltest/) and enter your domain. Target grade: **A** or **A+**.

## Security Considerations

- **Private key protection**: Never commit `privkey.pem` to version control. Use `.gitignore` or secrets management.
- **Certificate expiry**: Monitor expiry dates. Let's Encrypt certs expire after 90 days.
- **HSTS preload**: After 1 year of stable HTTPS, submit your domain to the [HSTS preload list](https://hstspreload.org/).
- **OCSP stapling**: Enabled by default in `nginx.conf` for faster TLS handshakes.

## Troubleshooting

### "Certificate not found" error
- Ensure `./certs/fullchain.pem` and `./certs/privkey.pem` exist.
- Check file permissions (nginx user must be able to read them).
- Verify volume mount in `docker-compose.yml`.

### HTTPS not working
- Check firewall rules (port 443 must be open).
- Verify DNS points to your server's public IP.
- Check nginx logs: `docker compose logs frontend`

### Certificate renewal fails
- Ensure port 80 is accessible (required for ACME challenge).
- Check certbot logs: `docker compose logs certbot`
- Verify `/.well-known/acme-challenge/` is served correctly:
  ```bash
  curl http://vaccichain.example.com/.well-known/acme-challenge/test
  ```

## Production Checklist

- [ ] Domain DNS configured
- [ ] Firewall allows ports 80 and 443
- [ ] TLS certificate obtained and valid
- [ ] HTTP redirects to HTTPS (301)
- [ ] HSTS header present with 1-year max-age
- [ ] TLS 1.2+ enforced (1.0/1.1 disabled)
- [ ] SSL Labs grade A or A+
- [ ] Certificate auto-renewal tested
- [ ] Private key secured (not in git)
- [ ] Monitoring alerts for certificate expiry

## References

- [Let's Encrypt Documentation](https://letsencrypt.org/docs/)
- [Mozilla SSL Configuration Generator](https://ssl-config.mozilla.org/)
- [OWASP TLS Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Transport_Layer_Protection_Cheat_Sheet.html)
