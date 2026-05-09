export type DocumentVersion = {
  id: string;
  documentId: string;
  versionNumber: number;
  fileAssetId: string;
  changeSummary: string | null;
  isMajorVersion: boolean;
  createdBy: string;
  createdAtUtc: string;
};

