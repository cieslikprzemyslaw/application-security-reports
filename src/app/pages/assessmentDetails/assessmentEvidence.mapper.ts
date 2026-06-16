import type { Evidence } from '~/domain';
import type { EvidenceCreateInput, EvidenceUpdateInput } from '~/services';

let evidenceExchangeLocalIdCounter = 0;

const createEvidenceExchangeLocalId = () =>
  `evidence-exchange-${++evidenceExchangeLocalIdCounter}`;

const normalizeOptionalText = (value?: string) => {
  const trimmed = value?.trim();

  return trimmed && trimmed.length > 0 ? trimmed : undefined;
};

const normalizeThreatIds = (threatIds: readonly string[]) =>
  Array.from(
    new Set(threatIds.map(threatId => threatId.trim()).filter(Boolean)),
  );

export interface EvidenceAttachmentValue {
  fileName: string;
  mimeType: string;
  attachmentSizeBytes: number;
}

export interface EvidenceHttpExchangeFormValue {
  localId: string;
  requestMethod: string;
  requestUrl: string;
  requestBody: string;
  responseStatusCode: string;
  responseStatusText: string;
  responseBody: string;
}

export interface EvidenceFormValue {
  type: Evidence['type'];
  title: string;
  description: string;
  content: string;
  capturedAt: string;
  threatIds: string[];
  attachment?: EvidenceAttachmentValue;
  httpExchanges: EvidenceHttpExchangeFormValue[];
}

export const createEmptyEvidenceExchangeFormValue =
  (): EvidenceHttpExchangeFormValue => ({
    localId: createEvidenceExchangeLocalId(),
    requestMethod: '',
    requestUrl: '',
    requestBody: '',
    responseStatusCode: '',
    responseStatusText: '',
    responseBody: '',
  });

export const createEmptyEvidenceFormValue = (
  type: Evidence['type'] = 'text',
): EvidenceFormValue => ({
  type,
  title: '',
  description: '',
  content: '',
  capturedAt: '',
  threatIds: [],
  attachment: undefined,
  httpExchanges:
    type === 'http' ? [createEmptyEvidenceExchangeFormValue()] : [],
});

const evidenceHttpExchangeToFormValue = (
  exchange: NonNullable<Evidence['httpExchanges']>[number],
): EvidenceHttpExchangeFormValue => ({
  localId: createEvidenceExchangeLocalId(),
  requestMethod: exchange.request.method ?? '',
  requestUrl: exchange.request.url ?? '',
  requestBody: exchange.request.body ?? '',
  responseStatusCode: String(exchange.response.statusCode),
  responseStatusText: exchange.response.statusText ?? '',
  responseBody: exchange.response.body ?? '',
});

export const evidenceToFormValue = (evidence: Evidence): EvidenceFormValue => ({
  type: evidence.type,
  title: evidence.title,
  description: evidence.description ?? '',
  content: evidence.content ?? '',
  capturedAt: evidence.capturedAt ?? '',
  threatIds: normalizeThreatIds(evidence.threatIds),
  attachment:
    evidence.fileName && evidence.mimeType
      ? {
          fileName: evidence.fileName,
          mimeType: evidence.mimeType,
          attachmentSizeBytes: evidence.attachmentSizeBytes ?? 0,
        }
      : undefined,
  httpExchanges:
    evidence.type === 'http'
      ? (evidence.httpExchanges?.map(exchange =>
          evidenceHttpExchangeToFormValue(exchange),
        ) ?? [createEmptyEvidenceExchangeFormValue()])
      : [],
});

export const evidenceAttachmentFromFile = (
  file: File,
): EvidenceAttachmentValue => ({
  fileName: file.name,
  mimeType: file.type,
  attachmentSizeBytes: file.size,
});

const buildHttpExchangeInput = (
  exchange: EvidenceHttpExchangeFormValue,
): NonNullable<EvidenceCreateInput['httpExchanges']>[number] => ({
  request: {
    method: exchange.requestMethod.trim(),
    url: exchange.requestUrl.trim(),
    body: normalizeOptionalText(exchange.requestBody),
  },
  response: {
    statusCode: Number.parseInt(exchange.responseStatusCode, 10),
    statusText: normalizeOptionalText(exchange.responseStatusText),
    body: normalizeOptionalText(exchange.responseBody),
  },
});

interface EvidenceRequestBuildOptions {
  assessmentId?: string;
  includeClearedHttpExchanges?: boolean;
}

const buildEvidenceRequestInput = (
  value: EvidenceFormValue,
  options: EvidenceRequestBuildOptions = {},
): Omit<EvidenceCreateInput, 'assessmentId'> &
  Partial<Pick<EvidenceUpdateInput, 'assessmentId'>> => {
  const request: Record<string, unknown> = {
    type: value.type,
    title: value.title.trim(),
    description: normalizeOptionalText(value.description),
    content: normalizeOptionalText(value.content),
    threatIds: normalizeThreatIds(value.threatIds),
    capturedAt: normalizeOptionalText(value.capturedAt),
  };

  if (options.assessmentId) {
    request.assessmentId = options.assessmentId;
  }

  if (value.attachment) {
    request.fileName = value.attachment.fileName.trim();
    request.mimeType = value.attachment.mimeType;
    request.attachmentSizeBytes = value.attachment.attachmentSizeBytes;
  }

  if (value.type === 'http') {
    request.httpExchanges = value.httpExchanges.map(buildHttpExchangeInput);
  } else if (options.includeClearedHttpExchanges) {
    request.httpExchanges = [];
  }

  return request as Omit<EvidenceCreateInput, 'assessmentId'> &
    Partial<Pick<EvidenceUpdateInput, 'assessmentId'>>;
};

export const evidenceFormValueToCreateInput = (
  assessmentId: string,
  value: EvidenceFormValue,
): EvidenceCreateInput =>
  buildEvidenceRequestInput(value, { assessmentId }) as EvidenceCreateInput;

export const evidenceFormValueToUpdateInput = (
  value: EvidenceFormValue,
  options: {
    shouldClearHttpExchanges?: boolean;
  } = {},
): EvidenceUpdateInput =>
  buildEvidenceRequestInput(value, {
    includeClearedHttpExchanges: options.shouldClearHttpExchanges,
  }) as EvidenceUpdateInput;

export const areEvidenceFormValuesEqual = (
  left: EvidenceFormValue,
  right: EvidenceFormValue,
) => JSON.stringify(left) === JSON.stringify(right);
