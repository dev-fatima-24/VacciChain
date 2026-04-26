const http = require('http');

const SERVICES = [
  { name: 'Backend', url: 'http://localhost:4000/health' },
  { name: 'Python Analytics', url: 'http://localhost:8001/health' },
  { name: 'Frontend', url: 'http://localhost:3000/' }
];

const CHECK_INTERVAL = 60000; // 1 minute
const ALERT_THRESHOLD = 2; // Alert after 2 failures

const status = {};
SERVICES.forEach(s => status[s.name] = { failures: 0, lastCheck: null, up: true });

function checkService(service) {
  const url = new URL(service.url);
  const options = {
    hostname: url.hostname,
    port: url.port,
    path: url.pathname,
    method: 'GET',
    timeout: 5000
  };

  const req = http.request(options, (res) => {
    status[service.name].lastCheck = new Date();
    if (res.statusCode === 200) {
      if (!status[service.name].up) {
        console.log(`✅ ${service.name} is back UP`);
        sendAlert(`✅ ${service.name} is back UP`);
      }
      status[service.name].up = true;
      status[service.name].failures = 0;
    } else {
      handleFailure(service, `Status code: ${res.statusCode}`);
    }
  });

  req.on('error', (err) => {
    handleFailure(service, err.message);
  });

  req.on('timeout', () => {
    req.destroy();
    handleFailure(service, 'Timeout');
  });

  req.end();
}

function handleFailure(service, reason) {
  status[service.name].lastCheck = new Date();
  status[service.name].failures++;
  console.log(`❌ ${service.name} check failed: ${reason} (Failure #${status[service.name].failures})`);

  if (status[service.name].failures >= ALERT_THRESHOLD && status[service.name].up) {
    status[service.name].up = false;
    const msg = `🚨 ALERT: ${service.name} is DOWN! Reason: ${reason}`;
    console.error(msg);
    sendAlert(msg);
  }
}

function sendAlert(message) {
  // Placeholder for real alerting (Slack/Email/PagerDuty)
  // In a real scenario, this would call a webhook or an API
  console.log(`[ALERT SENT] ${message}`);
}

console.log('Starting Uptime Monitor...');
setInterval(() => {
  SERVICES.forEach(checkService);
}, CHECK_INTERVAL);

// Initial check
SERVICES.forEach(checkService);
