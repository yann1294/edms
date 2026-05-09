export type Document = {
  id: string;
  organizationId: string;
  folderId: string | null;
  documentTypeId: string | null;
  ownerUserId: string;
  createdBy: string;
  title: string;
  description: string | null;
  status: string;
  confidentialityLevel: string | null;
  currentVersionId: string | null;
  archivedAtUtc: string | null;
  createdAtUtc: string;
  updatedAtUtc: string;
};

export type DocumentListResult = {
  items: Document[];
  page: number;
  pageSize: number;
  total: number;
  hasNext: boolean;
};

