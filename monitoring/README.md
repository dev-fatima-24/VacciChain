# VacciChain Uptime Monitoring

Prometheus + Blackbox Exporter + Alertmanager + Grafana stack for health checks and alerting.

## Services monitored

| Service | Endpoint | Check |
|---|---|---|
| Backend (Node.js) | `http://backend:4000/health` | HTTP 200 + `"status":"ok"` |
| Analytics (FastAPI) | `http://python-service:8001/health` | HTTP 200 + `"status":"ok"` |
| Frontend (nginx) | `http://frontend:80` | HTTP 200 |
| Staging backend | `$STAGING_BACKEND_URL/health` | HTTP 200 + `"status":"ok"` |

## Alert rules

| Alert | Condition | Severity | Fires after |
|---|---|---|---|
| `ServiceDown` | `probe_success == 0` | critical | 2 minutes |
| `ServiceSlowResponse` | response > 3s | warning | 5 minutes |
| `ServiceDegraded` | HTTP 503 | warning | 2 minutes |

## Notification channels

Configure via environment variables before starting:

```bash
export SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
export PAGERDUTY_ROUTING_KEY=...
export ALERT_EMAIL=ops@example.com
export SMTP_HOST=smtp.example.com
export SMTP_USER=...
export SMTP_PASSWORD=...
```

## Run

```bash
# Start monitoring stack alongside the main app
docker compose -f docker-compose.yml -f monitoring/docker-compose.monitoring.yml up

# Or standalone
cd monitoring
docker compose -f docker-compose.monitoring.yml up
```

## Dashboards

- Grafana: http://localhost:3001 (admin / `$GRAFANA_PASSWORD`)
- Prometheus: http://localhost:9090
- Alertmanager: http://localhost:9093
- Blackbox Exporter: http://localhost:9115
