import type { Evidence, Threat } from '~/domain';

import { formatDate, formatFileSize } from '~/app/utils/formatters';

export const getEvidenceTypeLabel = (type: Evidence['type']) =>
  ({
    http: 'HTTP',
    text: 'Text',
    terminal: 'Terminal',
    log: 'Log',
    file: 'File',
    note: 'Note',
    screenshot: 'Screenshot',
    request: 'Request',
    response: 'Response',
  })[type];

export const buildThreatTitleMap = (threats: Threat[]) =>
  new Map(threats.map(threat => [threat.id, threat.title] as const));

export { formatDate, formatFileSize };
