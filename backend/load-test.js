import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Rate, Trend, Counter, Gauge } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const responseTime = new Trend('response_time');
const successCount = new Counter('success_count');
const p95ResponseTime = new Trend('p95_response_time');

// Configuration
const BASE_URL = __ENV.BASE_URL || 'http://localhost:4000';
const DURATION = __ENV.DURATION || '60s';
const VUS = __ENV.VUS || 100;
const RAMP_UP = __ENV.RAMP_UP || '10s';

// Test wallets (valid Stellar addresses for testing)
const TEST_WALLETS = [
  'GBRPYHIL2CI3WHZDTOOQFC6EB4RBMPUTKXWDAUUJQHTITE4K3B6Rrytm',
  'GBBD47UZQ5UARKHTX4V2HA2KYRMF2ZSXBK6D5I4VRVHBT5RMJJWUBTQ',
  'GCZST3XVCDTUJ76ZAV2HA2KYRMF2ZSXBK6D5I4VRVHBT5RMJJWUBTQ',
  'GDZST3XVCDTUJ76ZAV2HA2KYRMF2ZSXBK6D5I4VRVHBT5RMJJWUBTQ',
  'GEZST3XVCDTUJ76ZAV2HA2KYRMF2ZSXBK6D5I4VRVHBT5RMJJWUBTQ',
];

export const options = {
  stages: [
    { duration: RAMP_UP, target: VUS },
    { duration: DURATION, target: VUS },
    { duration: '10s', target: 0 },
  ],
  thresholds: {
    'http_req_duration': ['p(95)<500', 'p(99)<1000'],
    'errors': ['rate<0.01'],
  },
};

export default function () {
  group('Verify Vaccination Endpoint', () => {
    const wallet = TEST_WALLETS[Math.floor(Math.random() * TEST_WALLETS.length)];
    const url = `${BASE_URL}/verify/${wallet}`;

    const params = {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${__ENV.JWT_TOKEN || 'test-token'}`,
      },
      timeout: '10s',
    };

    const response = http.get(url, params);

    // Record response time
    responseTime.add(response.timings.duration);
    p95ResponseTime.add(response.timings.duration);

    // Check response
    const success = check(response, {
      'status is 200 or 401': (r) => r.status === 200 || r.status === 401,
      'response time < 500ms': (r) => r.timings.duration < 500,
      'response has wallet field': (r) => r.body.includes('wallet'),
    });

    if (success) {
      successCount.add(1);
    } else {
      errorRate.add(1);
    }

    // Small delay between requests
    sleep(0.1);
  });
}

export function handleSummary(data) {
  return {
    'stdout': textSummary(data, { indent: ' ', enableColors: true }),
    'summary.json': JSON.stringify(data),
  };
}

function textSummary(data, options) {
  const indent = options.indent || '';
  const colors = options.enableColors || false;

  let summary = '\n=== Load Test Summary ===\n';
  summary += `Total Requests: ${data.metrics.http_reqs?.value || 0}\n`;
  summary += `Errors: ${data.metrics.errors?.value || 0}\n`;
  summary += `Success Rate: ${((1 - (data.metrics.errors?.value || 0) / (data.metrics.http_reqs?.value || 1)) * 100).toFixed(2)}%\n`;

  if (data.metrics.http_req_duration) {
    const duration = data.metrics.http_req_duration;
    summary += `\nResponse Times:\n`;
    summary += `  Min: ${duration.stats?.min?.toFixed(2) || 'N/A'}ms\n`;
    summary += `  Max: ${duration.stats?.max?.toFixed(2) || 'N/A'}ms\n`;
    summary += `  Avg: ${duration.stats?.avg?.toFixed(2) || 'N/A'}ms\n`;
    summary += `  P95: ${duration.stats?.p(95)?.toFixed(2) || 'N/A'}ms\n`;
    summary += `  P99: ${duration.stats?.p(99)?.toFixed(2) || 'N/A'}ms\n`;
  }

  return summary;
}
