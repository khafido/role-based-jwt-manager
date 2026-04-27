import swaggerJsDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Application } from 'express';
import path from 'path';
import { docsRateLimit } from '@/utils/security.js';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Role-Based JWT Manager API',
      version: '1.0.0',
      description: 'A production-ready Authentication & Authorization Service with role-based access control',
      contact: {
        name: 'API Support',
        email: 'support@example.com'
      },
      license: {
        name: 'ISC'
      }
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT token in the format: Bearer <token>'
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: [
    path.resolve(process.cwd(), './src/routes/*.ts'),
    path.resolve(process.cwd(), './src/controllers/*.ts'),
    path.resolve(process.cwd(), './src/models/*.ts')
  ]
};

const swaggerSpec = swaggerJsDoc(options);

export const setupSwagger = (app: Application) => {
  // Serve Swagger UI with rate limiting
  app.use('/docs', docsRateLimit, swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Role-Based JWT Manager API Documentation'
  }));
  
  // Serve JSON spec with rate limiting
  app.get('/docs.json', docsRateLimit, (_req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });
  
  // Add Swagger info to logs
  console.log('📚 Swagger documentation available at: /docs');
  console.log('📋 Swagger JSON spec available at: /docs.json');
};
