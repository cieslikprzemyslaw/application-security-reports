import assert from 'node:assert/strict';

import {
  MAX_RAW_HTTP_INPUT_BYTES,
  parseRawHttpExchange,
  parseRawHttpRequest,
} from './httpParser.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function assertNoErrors(
  result: { errors: { message: string }[] },
  label: string,
) {
  assert.equal(
    result.errors.length,
    0,
    `${label}: expected no errors, got: ${result.errors.map(e => e.message).join(', ')}`,
  );
}

function assertError(
  result: { errors: { field: string; message: string }[] },
  field: string,
  fragment: string,
  label: string,
) {
  const match = result.errors.find(
    e => e.field === field && e.message.includes(fragment),
  );
  assert.ok(
    match,
    `${label}: expected error on field "${field}" containing "${fragment}"; got: ${JSON.stringify(result.errors)}`,
  );
}

function assertWarning(
  result: { warnings: { message: string }[] },
  fragment: string,
  label: string,
) {
  const match = result.warnings.find(w => w.message.includes(fragment));
  assert.ok(
    match,
    `${label}: expected warning containing "${fragment}"; got: ${JSON.stringify(result.warnings)}`,
  );
}

// ---------------------------------------------------------------------------
// Request — origin target (relative path)
// ---------------------------------------------------------------------------

{
  const raw = 'GET /api/orders/1 HTTP/1.1\r\nHost: example.com\r\n\r\n';
  const result = parseRawHttpRequest(raw);
  assertNoErrors(result, 'origin target LF');
  assert.equal(result.parsed?.method, 'GET', 'method');
  assert.equal(result.parsed?.target, '/api/orders/1', 'target');
  assert.equal(result.parsed?.httpVersion, 'HTTP/1.1', 'httpVersion');
  assert.equal(result.parsed?.raw, raw, 'raw preserved');
  assert.equal(result.parsed?.body, '', 'empty body');
}

// ---------------------------------------------------------------------------
// Request — absolute URL target
// ---------------------------------------------------------------------------

{
  const raw =
    'POST https://example.com/api/v1/login HTTP/1.1\r\nContent-Type: application/json\r\n\r\n{"user":"a"}';
  const result = parseRawHttpRequest(raw);
  assertNoErrors(result, 'absolute URL target');
  assert.equal(result.parsed?.method, 'POST', 'method');
  assert.equal(
    result.parsed?.target,
    'https://example.com/api/v1/login',
    'target',
  );
  assert.equal(result.parsed?.body, '{"user":"a"}', 'body');
}

// ---------------------------------------------------------------------------
// Request — LF-only line endings
// ---------------------------------------------------------------------------

{
  const raw = 'DELETE /resource/42 HTTP/1.1\nHost: example.com\n\n';
  const result = parseRawHttpRequest(raw);
  assertNoErrors(result, 'LF-only line endings');
  assert.equal(result.parsed?.method, 'DELETE', 'method');
  assert.equal(result.parsed?.target, '/resource/42', 'target');
}

// ---------------------------------------------------------------------------
// Request — CRLF line endings
// ---------------------------------------------------------------------------

{
  const raw =
    'PUT /items/7 HTTP/1.1\r\nHost: example.com\r\nContent-Length: 4\r\n\r\ntest';
  const result = parseRawHttpRequest(raw);
  assertNoErrors(result, 'CRLF line endings');
  assert.equal(result.parsed?.body, 'test', 'body');
}

// ---------------------------------------------------------------------------
// Request — repeated headers (ordered, preserved)
// ---------------------------------------------------------------------------

{
  const raw =
    'GET /search HTTP/1.1\r\n' +
    'Host: example.com\r\n' +
    'X-Custom: first\r\n' +
    'X-Custom: second\r\n' +
    'X-Custom: third\r\n' +
    '\r\n';
  const result = parseRawHttpRequest(raw);
  assertNoErrors(result, 'repeated headers');
  const custom =
    result.parsed?.headers.filter(h => h.name === 'X-Custom') ?? [];
  assert.equal(custom.length, 3, 'three X-Custom headers');
  assert.equal(custom[0]?.value, 'first', 'first value');
  assert.equal(custom[1]?.value, 'second', 'second value');
  assert.equal(custom[2]?.value, 'third', 'third value');
}

// ---------------------------------------------------------------------------
// Request — colon in header value
// ---------------------------------------------------------------------------

{
  const raw =
    'GET / HTTP/1.1\r\n' +
    'Authorization: Bearer token:with:colons\r\n' +
    '\r\n';
  const result = parseRawHttpRequest(raw);
  assertNoErrors(result, 'colon in header value');
  const auth = result.parsed?.headers.find(h => h.name === 'Authorization');
  assert.equal(auth?.value, 'Bearer token:with:colons', 'value with colons');
}

// ---------------------------------------------------------------------------
// Request — multiline body
// ---------------------------------------------------------------------------

{
  const body = 'line one\nline two\nline three';
  const raw = `POST /data HTTP/1.1\nHost: example.com\n\n${body}`;
  const result = parseRawHttpRequest(raw);
  assertNoErrors(result, 'multiline body');
  assert.equal(result.parsed?.body, body, 'body preserved');
}

// ---------------------------------------------------------------------------
// Request — empty body with separator present
// ---------------------------------------------------------------------------

{
  const raw = 'OPTIONS /health HTTP/1.1\r\nHost: example.com\r\n\r\n';
  const result = parseRawHttpRequest(raw);
  assertNoErrors(result, 'empty body with separator');
  assert.equal(result.parsed?.body, '', 'body is empty string');
  assert.equal(result.warnings.length, 0, 'no warnings');
}

// ---------------------------------------------------------------------------
// Request — missing header/body separator (warning, not error)
// ---------------------------------------------------------------------------

{
  const raw = 'GET /status HTTP/1.1\r\nHost: example.com';
  const result = parseRawHttpRequest(raw);
  assertNoErrors(result, 'missing separator is a warning');
  assertWarning(
    result,
    'No header/body separator',
    'missing separator warning',
  );
  assert.equal(result.parsed?.body, '', 'empty body fallback');
}

// ---------------------------------------------------------------------------
// Request — request-only mode in exchange (no response)
// ---------------------------------------------------------------------------

{
  const raw = 'GET /ping HTTP/1.1\r\nHost: example.com\r\n\r\n';
  const result = parseRawHttpExchange(raw);
  assertNoErrors(result, 'request-only exchange');
  assert.ok(result.request, 'request is present');
  assert.equal(result.response, undefined, 'response is absent');
}

// ---------------------------------------------------------------------------
// Request — malformed start line (too few parts)
// ---------------------------------------------------------------------------

{
  const result = parseRawHttpRequest('GETONLY\r\nHost: x\r\n\r\n');
  assertError(
    result,
    'request',
    'must have the form',
    'single-token start line',
  );
}

{
  const result = parseRawHttpRequest('');
  assertError(result, 'request', 'must have the form', 'empty start line');
}

// ---------------------------------------------------------------------------
// Request — unrecognised HTTP version (not a blocking error on its own)
// ---------------------------------------------------------------------------

{
  const result = parseRawHttpRequest('GET / SMTP/1.0\r\nHost: x\r\n\r\n');
  assertError(
    result,
    'request',
    'HTTP version must start with "HTTP/"',
    'non-HTTP version',
  );
}

// ---------------------------------------------------------------------------
// Oversize input — request
// ---------------------------------------------------------------------------

{
  const oversize = 'A'.repeat(MAX_RAW_HTTP_INPUT_BYTES + 1);
  const result = parseRawHttpRequest(oversize);
  assertError(result, 'request', 'size limit', 'oversize request');
  assert.equal(result.parsed, undefined, 'no parsed result for oversize');
}

// ---------------------------------------------------------------------------
// No mutations to original strings
// ---------------------------------------------------------------------------

{
  const original = 'GET /check HTTP/1.1\r\nHost: example.com\r\n\r\n';
  const copy = original;
  parseRawHttpRequest(original);
  assert.equal(original, copy, 'original string unchanged after parse');
}

console.log('httpParser request tests passed');
