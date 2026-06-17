export type EvidenceExchangeErrorKey =
  | 'requestMethod'
  | 'requestUrl'
  | 'requestBody'
  | 'responseStatusCode'
  | 'responseStatusText'
  | 'responseBody';

export interface EvidenceHttpExchangeFieldErrors extends Partial<
  Record<EvidenceExchangeErrorKey, string>
> {
  general?: string;
}

export interface EvidenceFormErrors {
  type?: string;
  title?: string;
  description?: string;
  content?: string;
  capturedAt?: string;
  threatIds?: string;
  attachment?: string;
  httpExchanges?: string;
  general?: string;
  exchangeErrors: Record<string, EvidenceHttpExchangeFieldErrors>;
}

export type EvidenceDrawerMode = 'view' | 'create' | 'edit' | null;
