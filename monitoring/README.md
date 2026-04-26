# Uptime Monitoring

This directory contains the uptime monitoring configuration and tools for VacciChain.

## Components

- `uptime-checker.js`: A Node.js script that performs health checks every 60 seconds.
- `STATUS.md`: A manual status dashboard (can be automated in production).

## Setup

To run the uptime checker:

```bash
node monitoring/uptime-checker.js
```

In production, this should be run as a background process (e.g., using `pm2` or as a sidecar container).

## Alerting

Alerts are currently logged to the console. To integrate with Slack/PagerDuty, update the `sendAlert` function in `uptime-checker.js` to call your webhook URL.

## Health Endpoints

- **Backend**: `http://localhost:4000/health`
- **Python Analytics**: `http://localhost:8001/health`
- **Frontend**: `http://localhost:3000/`
