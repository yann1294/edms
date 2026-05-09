import { Injectable } from '@nestjs/common';
import { DocumentVersion } from '../document-version.types';

@Injectable()
export class InMemoryDocumentVersionsStore {
  readonly versionsById = new Map<string, DocumentVersion>();
  readonly versionIdsByDocumentId = new Map<string, number[]>(); // ordered list of version numbers
  readonly versionIdByDocAndNumber = new Map<string, string>(); // unique(document_id, version_number)
  readonly versionIdsByFileAssetId = new Map<string, Set<string>>();
}

