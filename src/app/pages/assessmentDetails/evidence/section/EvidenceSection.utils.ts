import type { Evidence, Threat } from '~/domain';

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

export const formatDate = (value?: string) => {
  if (!value) {
    return '—';
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? '—'
    : new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(date);
};

export const formatFileSize = (value?: number) => {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return '—';
  }

  if (value < 1024) {
    return `${value} B`;
  }

  if (value < 1024 * 1024) {
    return `${(value / 1024).toFixed(1)} KB`;
  }

  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
};

export const buildThreatTitleMap = (threats: Threat[]) =>
  new Map(threats.map(threat => [threat.id, threat.title] as const));
