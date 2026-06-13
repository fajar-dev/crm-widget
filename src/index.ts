import 'reflect-metadata';
import { OpenAPIHono } from '@hono/zod-openapi';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { swaggerUI } from '@hono/swagger-ui';
import { config } from './config/config.ts';
import { initializeDatabase, AppDataSource } from './config/database.ts';
import { initializeMinio } from './config/minio.ts';
import { errorHandler } from './core/middlewares/error-handler.middleware.ts';
import { createApiRouter } from './routes/api.ts';

// Create main Hono app
const app = new OpenAPIHono();

// Global middleware
app.use('*', logger());
app.use(
  '*',
  cors({
    origin: '*', // Configure for production
    allowHeaders: ['Content-Type', 'Authorization', 'X-Tenant-ID'],
    allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
  }),
);

// Global error handler
app.onError(errorHandler);

// Not found handler
app.notFound((c) => {
  return c.json(
    {
      success: false,
      statusCode: 404,
      message: 'Route not found',
      data: null,
    },
    404,
  );
});

// Health check
app.get('/health', (c) => {
  return c.json({
    success: true,
    statusCode: 200,
    message: 'OK',
    data: {
      name: config.APP_NAME,
      version: '0.1.0',
      environment: config.NODE_ENV,
      timestamp: new Date().toISOString(),
    },
  });
});

// OpenAPI documentation
app.doc('/doc', {
  openapi: '3.1.0',
  info: {
    title: `${config.APP_NAME} API`,
    version: '0.1.0',
    description: 'Multi-tenant CRM API built with Hono, TypeORM, and Zod',
  },
  servers: [
    {
      url: `http://localhost:${config.PORT}`,
      description: 'Local Development',
    },
  ],
  security: [{ Bearer: [] }],
});

// Register security scheme
app.openAPIRegistry.registerComponent('securitySchemes', 'Bearer', {
  type: 'http',
  scheme: 'bearer',
  bearerFormat: 'JWT',
  description: 'JWT access token. Get one from POST /api/auth/login',
});

// Swagger UI
app.get('/docs', swaggerUI({ url: '/doc' }));

// Initialize services and start server
async function bootstrap() {
  try {
    // Initialize database
    const dataSource = await initializeDatabase();

    // Initialize MinIO (non-blocking)
    initializeMinio().catch(console.warn);

    // Mount API routes
    const apiRouter = createApiRouter(dataSource);
    app.route('/api', apiRouter);

    console.log(`\n🚀 ${config.APP_NAME} is running!`);
    console.log(`   Environment: ${config.NODE_ENV}`);
    console.log(`   Server:      http://localhost:${config.PORT}`);
    console.log(`   Swagger UI:  http://localhost:${config.PORT}/docs`);
    console.log(`   OpenAPI:     http://localhost:${config.PORT}/doc\n`);
  } catch (error) {
    console.error('❌ Failed to start application:', error);
    process.exit(1);
  }
}

bootstrap();

export default {
  port: config.PORT,
  fetch: app.fetch,
};
