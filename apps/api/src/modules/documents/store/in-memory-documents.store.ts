import { Injectable } from '@nestjs/common';
import { Document } from '../document.types';

@Injectable()
export class InMemoryDocumentsStore {
  readonly documentsById = new Map<string, Document>();
  readonly documentIdsByOrg = new Map<string, Set<string>>();
}

