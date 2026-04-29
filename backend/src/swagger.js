const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'VacciChain Backend API',
      version: '1.0.0',
      description: 'Blockchain-based vaccination records on Stellar — soulbound, verifiable, tamper-proof.',
    },
    servers: [
      {
        url: 'http://localhost:4000',
        description: 'Development server',
      },
      {
        url: 'http://backend:4000',
        description: 'Docker server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
        apiKeyAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'X-API-Key',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
            },
          },
        },
        VaccinationRecord: {
          type: 'object',
          properties: {
            vaccine_name: {
              type: 'string',
            },
            date_administered: {
              type: 'string',
              format: 'date-time',
            },
            issuer: {
              type: 'string',
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
      },
    },
  },
  apis: ['./src/routes/*.js'],
};

const specs = swaggerJsdoc(options);

module.exports = specs;
