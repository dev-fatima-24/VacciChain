const { createLogger, format, transports } = require('winston');

const isProd = process.env.NODE_ENV === 'production';

const logger = createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: format.combine(
    format.timestamp(),
    format.errors({ stack: !isProd }),
    format.json()
  ),
  defaultMeta: { service: 'backend' },
  transports: [new transports.Console()],
});

module.exports = logger;
