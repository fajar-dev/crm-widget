import { minioClient } from '../../config/minio.ts';
import { config } from '../../config/config.ts';
import { InternalServerException } from '../exceptions/base.ts';

/**
 * Helper class for MinIO file operations.
 * Provides a simplified interface for common S3/MinIO operations.
 */
export class MinioHelper {
  /**
   * Upload a file to MinIO.
   * @param path - Object key/path in the bucket
   * @param data - File buffer or readable stream
   * @param contentType - MIME type of the file
   * @param bucket - Target bucket (defaults to config bucket)
   */
  static async upload(
    path: string,
    data: Buffer | ReadableStream,
    contentType: string,
    bucket: string = config.MINIO_BUCKET,
  ): Promise<{ etag: string; versionId: string | null }> {
    try {
      const buffer = data instanceof Buffer ? data : Buffer.from(await new Response(data).arrayBuffer());
      return await minioClient.putObject(bucket, path, buffer, buffer.length, {
        'Content-Type': contentType,
      });
    } catch (error) {
      throw new InternalServerException(`Failed to upload file: ${(error as Error).message}`);
    }
  }

  /**
   * Get a presigned URL for downloading a file.
   * @param path - Object key/path
   * @param expirySeconds - URL expiry time in seconds (default: 1 hour)
   * @param bucket - Source bucket
   */
  static async getPresignedUrl(
    path: string,
    expirySeconds = 3600,
    bucket: string = config.MINIO_BUCKET,
  ): Promise<string> {
    try {
      return await minioClient.presignedGetObject(bucket, path, expirySeconds);
    } catch (error) {
      throw new InternalServerException(`Failed to get presigned URL: ${(error as Error).message}`);
    }
  }

  /**
   * Delete a file from MinIO.
   */
  static async delete(
    path: string,
    bucket: string = config.MINIO_BUCKET,
  ): Promise<void> {
    try {
      await minioClient.removeObject(bucket, path);
    } catch (error) {
      throw new InternalServerException(`Failed to delete file: ${(error as Error).message}`);
    }
  }

  /**
   * Check if a file exists in MinIO.
   */
  static async exists(
    path: string,
    bucket: string = config.MINIO_BUCKET,
  ): Promise<boolean> {
    try {
      await minioClient.statObject(bucket, path);
      return true;
    } catch {
      return false;
    }
  }
}
