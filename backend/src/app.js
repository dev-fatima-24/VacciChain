require('dotenv').config();
const { initializeSecrets } = require('./secrets');
const config = require('./config');
const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const logger = require('./logger');
const { initDb } = require('./indexer/db');
const { startPoller, stopPoller } = require('./indexer/poller');
const swaggerSpec = require('./swagger');

const authRoutes = require('./routes/auth');
const vaccinationRoutes = require('./routes/vaccination');
const verifyRoutes = require('./routes/verify');
const adminRoutes = require('./routes/admin');
const patientRoutes = require('./routes/patient');
const consentRoutes = require('./routes/consent');
const eventsRoutes = require('./routes/events');
const onboardingRoutes = require('./routes/onboarding');
const apiVersion = require('./middleware/apiVersion');
const { getRpcServer } = require('./stellar/soroban');

const requestId = require('./middleware/requestId');

const app = express();

app.use(cors());
app.use(express.json({ limit: config.BODY_LIMIT }));
app.use(requestId);

app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    logger.info('request', {
      requestId: req.requestId,
      method: req.method,
      route: req.path,
      statusCode: res.statusCode,
      durationMs: Date.now() - start,
    });
  });
  next();
});

// v1 routes — all API endpoints are versioned under /v1/
const v1 = express.Router();
v1.use(apiVersion);
v1.use('/auth', authRoutes);
v1.use('/vaccination', vaccinationRoutes);
v1.use('/verify', verifyRoutes);
v1.use('/admin', adminRoutes);
v1.use('/patient', patientRoutes);
v1.use('/patient', consentRoutes);
v1.use('/events', eventsRoutes);
v1.use('/onboarding', onboardingRoutes);
app.use('/v1', v1);

// Legacy unversioned routes — 308 redirect to /v1/ with Deprecation header
app.use(['/auth', '/vaccination', '/verify', '/admin', '/patient', '/events'], (req, res) => {
  res.setHeader('Deprecation', 'true');
  res.redirect(308, `/v1${req.originalUrl}`);
});


/**
 * Health check endpoint.
 *
 * @route GET /health
 * @returns {Object} 200 - { status: "ok", soroban: true, timestamp }
 * @returns {Object} 503 - { status: "degraded", soroban: false, timestamp }
 */
app.get('/health', async (_req, res) => {
  let soroban = false;
  try {
    await getRpcServer().getHealth();
    soroban = true;
  } catch (_err) {
    // RPC unreachable
  }
  const body = { status: soroban ? 'ok' : 'degraded', soroban, timestamp: new Date().toISOString() };
  res.status(soroban ? 200 : 503).json(body);
});

if (require.main === module) {
  initializeSecrets().then(() => {
    initDb(config.DATABASE_PATH).then(() => {
      startPoller(config.EVENT_POLL_INTERVAL_MS);
      const server = app.listen(config.PORT, () => {
        logger.info(`Backend running on port ${config.PORT}`);
      });

      const gracefulShutdown = (signal) => {
        logger.info(`${signal} received. Starting graceful shutdown...`);
        
        stopPoller();

        server.close(() => {
          logger.info('Http server closed.');
          process.exit(0);
        });

        // Force exit after 10 seconds
        setTimeout(() => {
          logger.error('Could not close connections in time, forcefully shutting down');
          process.exit(1);
        }, 10000);
      };

      process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
      process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    });
  }).catch(error => {
    logger.error(`Failed to initialize secrets: ${error.message}`);
    process.exit(1);
  });
}

module.exports = app;
