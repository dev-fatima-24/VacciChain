require('dotenv').config();
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

const app = express();

app.use(cors());
app.use(express.json({ limit: config.BODY_LIMIT }));

/**
 * Request logging middleware.
 *
 * Logs all incoming HTTP requests with method and path.
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 *
 * @side-effects Logs request information
 */
app.use((req, _res, next) => {
  logger.info('request', { method: req.method, path: req.path });
  next();
});

app.use('/auth', authRoutes);
app.use('/vaccination', vaccinationRoutes);
app.use('/verify', verifyRoutes);
app.use('/admin', adminRoutes);
app.use('/patient', patientRoutes);

/**
 * Health check endpoint.
 *
 * @route GET /health
 * @returns {Object} 200 - Service health status
 * @returns {string} 200.status - Always "ok"
 */
app.get('/health', (_req, res) => res.json({ status: 'ok' }));

if (require.main === module) {
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
}

module.exports = app;
