import { Injectable } from '@nestjs/common';
import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { StorageObjectMetadata, StorageService, StorageUploadInput } from './storage.service';

type StorageProvider = 's3' | 'minio';

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required.`);
  return value;
}

function providerFromEnv(): StorageProvider {
  const raw = requiredEnv('STORAGE_PROVIDER').toLowerCase();
  if (raw === 's3' || raw === 'minio') return raw;
  throw new Error('STORAGE_PROVIDER must be s3|minio.');
}

@Injectable()
export class S3StorageService implements StorageService {
  private readonly provider: StorageProvider;
  private readonly bucket: string;
  private readonly client: S3Client;

  constructor() {
    this.provider = providerFromEnv();
    this.bucket = requiredEnv('STORAGE_BUCKET');

    const region = requiredEnv('STORAGE_REGION');
    const endpoint = process.env.STORAGE_ENDPOINT;
    const accessKeyId = requiredEnv('STORAGE_ACCESS_KEY_ID');
    const secretAccessKey = requiredEnv('STORAGE_SECRET_ACCESS_KEY');

    this.client = new S3Client({
      region,
      ...(endpoint ? { endpoint } : {}),
      forcePathStyle: this.provider === 'minio',
      credentials: { accessKeyId, secretAccessKey },
    });
  }

  async uploadObject(input: StorageUploadInput): Promise<void> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: input.objectKey,
        Body: input.body,
        ContentType: input.contentType,
      }),
    );
  }

  async getObjectMetadata(objectKey: string): Promise<StorageObjectMetadata | null> {
    try {
      const result = await this.client.send(
        new HeadObjectCommand({
          Bucket: this.bucket,
          Key: objectKey,
        }),
      );
      return {
        contentType: result.ContentType,
        sizeBytes: typeof result.ContentLength === 'number' ? result.ContentLength : undefined,
        etag: result.ETag,
      };
    } catch {
      return null;
    }
  }

  async getSignedDownloadUrl(objectKey: string, expiresInSeconds?: number): Promise<string> {
    const ttl = expiresInSeconds ?? Number(process.env.STORAGE_SIGNED_URL_EXPIRES_IN_SECONDS ?? 300);
    const command = new GetObjectCommand({ Bucket: this.bucket, Key: objectKey });
    return getSignedUrl(this.client, command, { expiresIn: ttl });
  }

  async deleteObject(objectKey: string): Promise<void> {
    await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: objectKey }));
  }
}

