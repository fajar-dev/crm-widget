import * as Minio from 'minio';
import { config } from './config.ts';

export const minioClient = new Minio.Client({
  endPoint: config.MINIO_ENDPOINT,
  port: config.MINIO_PORT,
  useSSL: config.MINIO_USE_SSL,
  accessKey: config.MINIO_ACCESS_KEY,
  secretKey: config.MINIO_SECRET_KEY,
});

/**
 * Initialize MinIO: verify connection and auto-create default bucket.
 */
export async function initializeMinio(): Promise<void> {
  try {
    const bucketExists = await minioClient.bucketExists(config.MINIO_BUCKET);
    if (!bucketExists) {
      await minioClient.makeBucket(config.MINIO_BUCKET);
      console.log(`✅ MinIO bucket '${config.MINIO_BUCKET}' created`);
    } else {
      console.log(`✅ MinIO bucket '${config.MINIO_BUCKET}' already exists`);
    }
  } catch (error) {
    console.warn('⚠️ MinIO initialization failed (non-fatal):', error);
  }
}
