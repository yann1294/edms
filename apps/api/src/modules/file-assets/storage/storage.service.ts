export type StorageUploadInput = {
  objectKey: string;
  body: Buffer;
  contentType: string;
};

export type StorageObjectMetadata = {
  contentType?: string;
  sizeBytes?: number;
  etag?: string;
};

export type StorageService = {
  uploadObject(input: StorageUploadInput): Promise<void>;
  getObjectMetadata(objectKey: string): Promise<StorageObjectMetadata | null>;
  getSignedDownloadUrl(objectKey: string, expiresInSeconds?: number): Promise<string>;
  deleteObject(objectKey: string): Promise<void>;
};

export const STORAGE_SERVICE = Symbol('STORAGE_SERVICE');

