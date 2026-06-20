import {
  CreateEvidenceInput,
  UpdateEvidenceInput,
} from '../../src/domain/evidence.js';

export type CreateEvidenceRequestBody = Omit<
  CreateEvidenceInput,
  'filePath' | 'storageKey'
>;
export type UpdateEvidenceRequestBody = Omit<
  UpdateEvidenceInput,
  'filePath' | 'storageKey'
>;
