import type { Evidence } from '~/domain';

export const MAX_ATTACHMENT_SIZE_BYTES = 5 * 1024 * 1024;

export const attachmentAcceptedTypes = [
  'application/json',
  'application/pdf',
  'image/gif',
  'image/jpeg',
  'image/png',
  'image/webp',
  'text/plain',
  '.gif',
  '.jpeg',
  '.jpg',
  '.json',
  '.pdf',
  '.png',
  '.txt',
  '.webp',
].join(',');

export const evidenceTypeOptions: Array<{
  label: string;
  value: Evidence['type'];
}> = [
  { label: 'HTTP', value: 'http' },
  { label: 'Text', value: 'text' },
  { label: 'Terminal', value: 'terminal' },
  { label: 'Log', value: 'log' },
  { label: 'File', value: 'file' },
  { label: 'Note', value: 'note' },
  { label: 'Screenshot', value: 'screenshot' },
  { label: 'Request', value: 'request' },
  { label: 'Response', value: 'response' },
];
