/**
 * Maximum input size for a single raw HTTP message (request or response).
 * Inputs exceeding this limit are rejected with a structured error.
 */
export const MAX_RAW_HTTP_INPUT_BYTES = 512 * 1024;
const HTTP_VERSION_RE = /^HTTP\/\d+(?:\.\d+)?$/;

export interface RawHttpHeader {
  name: string;
  value: string;
}

export interface ParsedHttpRequest {
  method: string;
  target: string;
  httpVersion: string;
  headers: RawHttpHeader[];
  body: string;
  raw: string;
}

export interface ParsedHttpResponse {
  httpVersion: string;
  statusCode: number;
  reasonPhrase: string;
  headers: RawHttpHeader[];
  body: string;
  raw: string;
}

export interface HttpParseWarning {
  message: string;
}

export interface HttpParseError {
  field: 'request' | 'response';
  message: string;
}

export interface HttpExchangeParseResult {
  request?: ParsedHttpRequest;
  response?: ParsedHttpResponse;
  warnings: HttpParseWarning[];
  errors: HttpParseError[];
}

function normalizeLineEndings(raw: string): string {
  return raw.replace(/\r\n/g, '\n');
}

function rawHttpInputByteLength(raw: string): number {
  return Buffer.byteLength(raw, 'utf8');
}

function splitHeadersAndBody(raw: string): {
  headerSection: string;
  body: string;
  hasSeparator: boolean;
} {
  const crlfSeparatorIdx = raw.indexOf('\r\n\r\n');
  const lfSeparatorIdx = raw.indexOf('\n\n');

  if (crlfSeparatorIdx === -1 && lfSeparatorIdx === -1) {
    return { headerSection: raw, body: '', hasSeparator: false };
  }

  const separatorIdx =
    crlfSeparatorIdx === -1
      ? lfSeparatorIdx
      : lfSeparatorIdx === -1
        ? crlfSeparatorIdx
        : Math.min(crlfSeparatorIdx, lfSeparatorIdx);
  const separatorLength = raw.startsWith('\r\n\r\n', separatorIdx) ? 4 : 2;

  return {
    headerSection: raw.slice(0, separatorIdx),
    body: raw.slice(separatorIdx + separatorLength),
    hasSeparator: true,
  };
}

function parseHeaderLines(lines: string[]): RawHttpHeader[] {
  const headers: RawHttpHeader[] = [];
  for (const line of lines) {
    if (line.trim().length === 0) continue;
    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) {
      headers.push({ name: line.trim(), value: '' });
    } else {
      headers.push({
        name: line.slice(0, colonIdx).trim(),
        value: line.slice(colonIdx + 1).trim(),
      });
    }
  }
  return headers;
}

/**
 * Parse a raw HTTP request message.
 *
 * Preserves the original raw text in `parsed.raw`. Line endings are normalised
 * to LF in headers and start-line fields, while the body is preserved exactly as
 * supplied. Input is treated as untrusted plain text and is never executed or
 * HTML-rendered.
 */
export function parseRawHttpRequest(raw: string): {
  parsed?: ParsedHttpRequest;
  warnings: HttpParseWarning[];
  errors: HttpParseError[];
} {
  const warnings: HttpParseWarning[] = [];
  const errors: HttpParseError[] = [];

  if (rawHttpInputByteLength(raw) > MAX_RAW_HTTP_INPUT_BYTES) {
    errors.push({
      field: 'request',
      message: `Raw request exceeds the ${MAX_RAW_HTTP_INPUT_BYTES / 1024} KB size limit`,
    });
    return { warnings, errors };
  }

  const { headerSection, body, hasSeparator } = splitHeadersAndBody(raw);
  const normalizedHeaderSection = normalizeLineEndings(headerSection);

  if (!hasSeparator) {
    warnings.push({
      message:
        'No header/body separator found in request; body treated as empty',
    });
  }

  const lines = normalizedHeaderSection.split('\n');
  const startLine = lines[0] ?? '';
  const headerLines = lines.slice(1);

  const firstSpaceIdx = startLine.indexOf(' ');
  const lastSpaceIdx = startLine.lastIndexOf(' ');

  if (firstSpaceIdx === -1 || firstSpaceIdx === lastSpaceIdx) {
    errors.push({
      field: 'request',
      message: `Request line must have the form "METHOD target HTTP/version"; got: "${startLine}"`,
    });
    return { warnings, errors };
  }

  const method = startLine.slice(0, firstSpaceIdx);
  const target = startLine.slice(firstSpaceIdx + 1, lastSpaceIdx);
  const httpVersion = startLine.slice(lastSpaceIdx + 1);

  if (!method) {
    errors.push({ field: 'request', message: 'Request method is empty' });
  }

  if (!target.trim()) {
    errors.push({ field: 'request', message: 'Request target is empty' });
  }

  if (!HTTP_VERSION_RE.test(httpVersion)) {
    errors.push({
      field: 'request',
      message: `HTTP version must match "HTTP/x" or "HTTP/x.y"; got: "${httpVersion}"`,
    });
  }

  if (errors.length > 0) {
    return { warnings, errors };
  }

  return {
    parsed: {
      method,
      target,
      httpVersion,
      headers: parseHeaderLines(headerLines),
      body,
      raw,
    },
    warnings,
    errors,
  };
}

/**
 * Parse a raw HTTP response message.
 *
 * Preserves the original raw text in `parsed.raw`. Line endings are normalised
 * to LF in headers and start-line fields, while the body is preserved exactly as
 * supplied. Input is treated as untrusted plain text and is never executed or
 * HTML-rendered.
 */
export function parseRawHttpResponse(raw: string): {
  parsed?: ParsedHttpResponse;
  warnings: HttpParseWarning[];
  errors: HttpParseError[];
} {
  const warnings: HttpParseWarning[] = [];
  const errors: HttpParseError[] = [];

  if (rawHttpInputByteLength(raw) > MAX_RAW_HTTP_INPUT_BYTES) {
    errors.push({
      field: 'response',
      message: `Raw response exceeds the ${MAX_RAW_HTTP_INPUT_BYTES / 1024} KB size limit`,
    });
    return { warnings, errors };
  }

  const { headerSection, body, hasSeparator } = splitHeadersAndBody(raw);
  const normalizedHeaderSection = normalizeLineEndings(headerSection);

  if (!hasSeparator) {
    warnings.push({
      message:
        'No header/body separator found in response; body treated as empty',
    });
  }

  const lines = normalizedHeaderSection.split('\n');
  const startLine = lines[0] ?? '';
  const headerLines = lines.slice(1);

  const firstSpaceIdx = startLine.indexOf(' ');

  if (firstSpaceIdx === -1) {
    errors.push({
      field: 'response',
      message: `Response line must have the form "HTTP/version status-code [reason]"; got: "${startLine}"`,
    });
    return { warnings, errors };
  }

  const httpVersion = startLine.slice(0, firstSpaceIdx);
  const rest = startLine.slice(firstSpaceIdx + 1);
  const secondSpaceIdx = rest.indexOf(' ');
  const statusCodeStr =
    secondSpaceIdx === -1 ? rest : rest.slice(0, secondSpaceIdx);
  const reasonPhrase =
    secondSpaceIdx === -1 ? '' : rest.slice(secondSpaceIdx + 1);

  if (!HTTP_VERSION_RE.test(httpVersion)) {
    errors.push({
      field: 'response',
      message: `HTTP version must match "HTTP/x" or "HTTP/x.y"; got: "${httpVersion}"`,
    });
  }

  const statusCode = Number(statusCodeStr);
  if (!Number.isInteger(statusCode) || statusCode < 100 || statusCode > 599) {
    errors.push({
      field: 'response',
      message: `Status code must be a 3-digit integer (100–599); got: "${statusCodeStr}"`,
    });
  }

  if (errors.length > 0) {
    return { warnings, errors };
  }

  return {
    parsed: {
      httpVersion,
      statusCode,
      reasonPhrase,
      headers: parseHeaderLines(headerLines),
      body,
      raw,
    },
    warnings,
    errors,
  };
}

/**
 * Parse a raw HTTP exchange (request and optional response).
 *
 * Returns structured parse results, warnings, and actionable errors without
 * mutating any external state. When `rawResponse` is omitted the result
 * contains only the parsed request (request-only mode).
 */
export function parseRawHttpExchange(
  rawRequest: string,
  rawResponse?: string,
): HttpExchangeParseResult {
  const warnings: HttpParseWarning[] = [];
  const errors: HttpParseError[] = [];

  const reqResult = parseRawHttpRequest(rawRequest);
  warnings.push(...reqResult.warnings);
  errors.push(...reqResult.errors);

  let response: ParsedHttpResponse | undefined;

  if (rawResponse !== undefined) {
    const resResult = parseRawHttpResponse(rawResponse);
    warnings.push(...resResult.warnings);
    errors.push(...resResult.errors);
    response = resResult.parsed;
  }

  return {
    request: reqResult.parsed,
    response,
    warnings,
    errors,
  };
}
