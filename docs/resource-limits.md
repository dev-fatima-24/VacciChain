# Container Resource Limits

## Rationale

Limits are set at roughly **2× the observed idle/steady-state peak** for memory and
**realistic burst ceiling** for CPU. This gives each service room to handle traffic
spikes while ensuring a runaway container cannot starve its neighbours on the host.

## Per-service breakdown

| Service | CPU limit | Memory limit | Basis |
|---|---|---|---|
| `frontend` | 0.05 | 32 MB | nginx static file serving; no dynamic computation |
| `backend` | 0.75 | 256 MB | Node.js heap ~80–100 MB at rest; XDR buffer bursts during Soroban calls |
| `python-service` | 0.50 | 128 MB | FastAPI/uvicorn baseline ~60 MB; async httpx fan-out to Horizon |

## OOM kill detection

Docker's `json-file` logging driver captures kernel OOM kill messages.
To monitor in real time:

```bash
# Stream OOM events from all containers
docker events --filter event=oom

# Check if a container was OOM-killed (exit code 137)
docker inspect <container_name> --format '{{.State.OOMKilled}}'
```

To alert on OOM kills in CI/CD or production, pipe `docker events` to your
observability stack (e.g. Datadog, Prometheus `container_oom_events_total`,
or a simple shell watcher):

```bash
docker events --filter event=oom --format '{{.Actor.Attributes.name}}' | \
  while read name; do
    echo "[ALERT] OOM kill: $name at $(date -u +%FT%TZ)"
  done
```

## Adjusting limits

If you observe legitimate OOM kills under normal load, increase the memory limit
in `docker-compose.yml` in 64 MB increments and re-profile. Do not remove limits
entirely — use `reservations` to guarantee a floor and `limits` to cap the ceiling.
