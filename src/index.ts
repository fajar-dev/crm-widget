import 'reflect-metadata';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { swaggerUI } from '@hono/swagger-ui';
import { config } from './config/config.ts';
import { initializeDatabase } from './config/database.ts';
import { TenantDataSourceManager } from './config/tenant-datasource.ts';
import { initializeMinio } from './config/minio.ts';
import { errorHandler } from './core/middlewares/error-handler.middleware.ts';
import { createApiRouter } from './routes/api.ts';

// Create main Hono app
const app = new Hono();

// Global middleware
app.use('*', logger());
app.use(
  '*',
  cors({
    origin: '*',
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
      version: '0.4.0',
      environment: config.NODE_ENV,
      timestamp: new Date().toISOString(),
    },
  });
});

// Serve OpenAPI YAML spec
app.get('/openapi.yaml', async (c) => {
  const file = Bun.file(`${import.meta.dir}/../docs/swagger.yml`);
  const content = await file.text();
  return new Response(content, {
    headers: { 'Content-Type': 'application/x-yaml' },
  });
});

// Swagger UI
app.get('/docs', swaggerUI({ url: '/openapi.yaml' }));

// Initialize services and start server
async function bootstrap() {
  try {
    const sharedDataSource = await initializeDatabase();
    initializeMinio().catch(console.warn);

    const tenantDataSourceManager = new TenantDataSourceManager({
      host: config.DB_HOST,
      port: config.DB_PORT,
      username: config.DB_USERNAME,
      password: config.DB_PASSWORD,
      database: config.DB_NAME,
      logging: config.DB_LOGGING,
    });

    const apiRouter = createApiRouter(sharedDataSource, tenantDataSourceManager);
    app.route('/api', apiRouter);

    console.log(`\n🚀 ${config.APP_NAME} is running!`);
    console.log(`   Environment: ${config.NODE_ENV}`);
    console.log(`   Server:      http://localhost:${config.PORT}`);
    console.log(`   Swagger UI:  http://localhost:${config.PORT}/docs`);
    console.log(`   OpenAPI:     http://localhost:${config.PORT}/openapi.yaml\n`);
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
