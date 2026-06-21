/**
 * Maximum input size for a single raw HTTP message (request or response).
 * Inputs exceeding this limit are rejected with a structured error.
 */
export const MAX_RAW_HTTP_INPUT_BYTES = 512 * 1024;

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

function splitHeadersAndBody(normalized: string): {
  headerSection: string;
  body: string;
  hasSeparator: boolean;
} {
  const idx = normalized.indexOf('\n\n');
  if (idx === -1) {
    return { headerSection: normalized, body: '', hasSeparator: false };
  }
  return {
    headerSection: normalized.slice(0, idx),
    body: normalized.slice(idx + 2),
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
 * to LF in `headers`, `body`, and all parsed fields; the original is untouched.
 * Input is treated as untrusted plain text and is never executed or HTML-rendered.
 */
export function parseRawHttpRequest(raw: string): {
  parsed?: ParsedHttpRequest;
  warnings: HttpParseWarning[];
  errors: HttpParseError[];
} {
  const warnings: HttpParseWarning[] = [];
  const errors: HttpParseError[] = [];

  if (raw.length > MAX_RAW_HTTP_INPUT_BYTES) {
    errors.push({
      field: 'request',
      message: `Raw request exceeds the ${MAX_RAW_HTTP_INPUT_BYTES / 1024} KB size limit`,
    });
    return { warnings, errors };
  }

  const normalized = normalizeLineEndings(raw);
  const { headerSection, body, hasSeparator } = splitHeadersAndBody(normalized);

  if (!hasSeparator) {
    warnings.push({
      message:
        'No header/body separator found in request; body treated as empty',
    });
  }

  const lines = headerSection.split('\n');
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

  if (!httpVersion.startsWith('HTTP/')) {
    errors.push({
      field: 'request',
      message: `HTTP version must start with "HTTP/"; got: "${httpVersion}"`,
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
 * to LF in `headers`, `body`, and all parsed fields; the original is untouched.
 * Input is treated as untrusted plain text and is never executed or HTML-rendered.
 */
export function parseRawHttpResponse(raw: string): {
  parsed?: ParsedHttpResponse;
  warnings: HttpParseWarning[];
  errors: HttpParseError[];
} {
  const warnings: HttpParseWarning[] = [];
  const errors: HttpParseError[] = [];

  if (raw.length > MAX_RAW_HTTP_INPUT_BYTES) {
    errors.push({
      field: 'response',
      message: `Raw response exceeds the ${MAX_RAW_HTTP_INPUT_BYTES / 1024} KB size limit`,
    });
    return { warnings, errors };
  }

  const normalized = normalizeLineEndings(raw);
  const { headerSection, body, hasSeparator } = splitHeadersAndBody(normalized);

  if (!hasSeparator) {
    warnings.push({
      message:
        'No header/body separator found in response; body treated as empty',
    });
  }

  const lines = headerSection.split('\n');
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

  if (!httpVersion.startsWith('HTTP/')) {
    errors.push({
      field: 'response',
      message: `HTTP version must start with "HTTP/"; got: "${httpVersion}"`,
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
