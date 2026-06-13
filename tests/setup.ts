/**
 * Global test setup — preloaded before all tests.
 * Sets environment variables for test mode.
 */
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key-for-testing-minimum-16-chars';
process.env.JWT_EXPIRES_IN = '15m';
process.env.JWT_REFRESH_EXPIRES_IN = '7d';
process.env.APP_NAME = 'CRM Test';
process.env.PORT = '3001';
process.env.MINIO_ENDPOINT = 'localhost';
process.env.MINIO_PORT = '9000';
process.env.MINIO_USE_SSL = 'false';
process.env.MINIO_ACCESS_KEY = 'minioadmin';
process.env.MINIO_SECRET_KEY = 'minioadmin';
process.env.MINIO_BUCKET = 'crm-test';
