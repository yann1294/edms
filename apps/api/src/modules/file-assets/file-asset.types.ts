export type UploadStatus = 'pending' | 'completed' | 'failed';

export type FileAsset = {
  id: string;
  storageProvider: string;
  bucketName: string;
  objectKey: string;
  originalFilename: string;
  mimeType: string;
  sizeBytes: number;
  checksumSha256: string;
  uploadStatus: UploadStatus;
  encryptionStatus: string | null;
  previewObjectKey: string | null;
  thumbnailObjectKey: string | null;
  createdBy: string | null;
  createdAtUtc: string;
};

export type FileAssetPublicDto = {
  id: string;
  originalFilename: string;
  mimeType: string;
  sizeBytes: number;
  checksumSha256: string;
  uploadStatus: UploadStatus;
  createdAtUtc: string;
};

