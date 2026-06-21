import assert from 'node:assert/strict';

import {
  MAX_RAW_HTTP_INPUT_BYTES,
  parseRawHttpExchange,
  parseRawHttpResponse,
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
// Response — valid with reason phrase
// ---------------------------------------------------------------------------

{
  const raw =
    'HTTP/1.1 200 OK\r\n' +
    'Content-Type: application/json\r\n' +
    'Content-Length: 11\r\n' +
    '\r\n' +
    '{"ok":true}';
  const result = parseRawHttpResponse(raw);
  assertNoErrors(result, 'response with reason');
  assert.equal(result.parsed?.httpVersion, 'HTTP/1.1', 'httpVersion');
  assert.equal(result.parsed?.statusCode, 200, 'statusCode');
  assert.equal(result.parsed?.reasonPhrase, 'OK', 'reasonPhrase');
  assert.equal(result.parsed?.body, '{"ok":true}', 'body');
  assert.equal(result.parsed?.raw, raw, 'raw preserved');
}

// ---------------------------------------------------------------------------
// Response — valid without reason phrase (HTTP/2 style)
// ---------------------------------------------------------------------------

{
  const raw = 'HTTP/2 204\r\nContent-Length: 0\r\n\r\n';
  const result = parseRawHttpResponse(raw);
  assertNoErrors(result, 'response without reason');
  assert.equal(result.parsed?.statusCode, 204, 'statusCode');
  assert.equal(result.parsed?.reasonPhrase, '', 'empty reasonPhrase');
}

// ---------------------------------------------------------------------------
// Response — multi-word reason phrase
// ---------------------------------------------------------------------------

{
  const raw = 'HTTP/1.1 404 Not Found At All\r\n\r\n';
  const result = parseRawHttpResponse(raw);
  assertNoErrors(result, 'multi-word reason');
  assert.equal(result.parsed?.reasonPhrase, 'Not Found At All', 'full reason');
}

// ---------------------------------------------------------------------------
// Response — repeated headers
// ---------------------------------------------------------------------------

{
  const raw =
    'HTTP/1.1 200 OK\r\n' +
    'Set-Cookie: a=1\r\n' +
    'Set-Cookie: b=2\r\n' +
    '\r\n';
  const result = parseRawHttpResponse(raw);
  assertNoErrors(result, 'repeated response headers');
  const cookies =
    result.parsed?.headers.filter(h => h.name === 'Set-Cookie') ?? [];
  assert.equal(cookies.length, 2, 'two Set-Cookie headers');
  assert.equal(cookies[0]?.value, 'a=1');
  assert.equal(cookies[1]?.value, 'b=2');
}

// ---------------------------------------------------------------------------
// Response — LF-only line endings
// ---------------------------------------------------------------------------

{
  const raw =
    'HTTP/1.1 301 Moved Permanently\nLocation: https://new.example.com\n\n';
  const result = parseRawHttpResponse(raw);
  assertNoErrors(result, 'response LF-only');
  assert.equal(result.parsed?.statusCode, 301, 'statusCode');
}

// ---------------------------------------------------------------------------
// Response — malformed start line
// ---------------------------------------------------------------------------

{
  const result = parseRawHttpResponse('GARBAGE\r\n\r\n');
  assertError(
    result,
    'response',
    'must have the form',
    'garbage response start',
  );
}

{
  const result = parseRawHttpResponse('HTTP/1.1 abc OK\r\n\r\n');
  assertError(
    result,
    'response',
    'Status code must be a 3-digit integer',
    'non-numeric status',
  );
}

{
  const result = parseRawHttpResponse('HTTP/1.1 99 Too Low\r\n\r\n');
  assertError(
    result,
    'response',
    'Status code must be a 3-digit integer',
    'status below 100',
  );
}

{
  const result = parseRawHttpResponse('HTTP/1.1 600 Too High\r\n\r\n');
  assertError(
    result,
    'response',
    'Status code must be a 3-digit integer',
    'status above 599',
  );
}

{
  const result = parseRawHttpResponse('200 OK\r\n\r\n');
  assertError(
    result,
    'response',
    'HTTP version must start with "HTTP/"',
    'missing HTTP version',
  );
}

// ---------------------------------------------------------------------------
// Response — missing separator (warning)
// ---------------------------------------------------------------------------

{
  const raw = 'HTTP/1.1 200 OK\r\nContent-Type: text/plain';
  const result = parseRawHttpResponse(raw);
  assertNoErrors(result, 'response missing separator');
  assertWarning(
    result,
    'No header/body separator',
    'response missing separator warning',
  );
}

// ---------------------------------------------------------------------------
// Full exchange — valid request + response
// ---------------------------------------------------------------------------

{
  const rawReq =
    'POST /login HTTP/1.1\r\nHost: example.com\r\nContent-Type: application/json\r\n\r\n{"user":"admin"}';
  const rawRes =
    'HTTP/1.1 200 OK\r\nContent-Type: application/json\r\n\r\n{"token":"abc"}';
  const result = parseRawHttpExchange(rawReq, rawRes);
  assertNoErrors(result, 'full exchange');
  assert.equal(result.request?.method, 'POST', 'method');
  assert.equal(result.response?.statusCode, 200, 'statusCode');
  assert.equal(result.request?.raw, rawReq, 'request raw preserved');
  assert.equal(result.response?.raw, rawRes, 'response raw preserved');
}

// ---------------------------------------------------------------------------
// Script-like and HTML-like input — remains inert plain text
// ---------------------------------------------------------------------------

{
  const raw =
    'POST /inject HTTP/1.1\r\n' +
    'Host: example.com\r\n' +
    'X-Injected: <script>alert(1)</script>\r\n' +
    '\r\n' +
    '<img src=x onerror=alert(document.cookie)>';
  const result = parseRawHttpExchange(raw);
  assertNoErrors(result, 'script-like input');
  const injected = result.request?.headers.find(h => h.name === 'X-Injected');
  assert.equal(
    injected?.value,
    '<script>alert(1)</script>',
    'script tag preserved as plain text',
  );
  assert.equal(
    result.request?.body,
    '<img src=x onerror=alert(document.cookie)>',
    'HTML body preserved as plain text',
  );
}

// ---------------------------------------------------------------------------
// Oversize input — response
// ---------------------------------------------------------------------------

{
  const oversize = 'B'.repeat(MAX_RAW_HTTP_INPUT_BYTES + 1);
  const result = parseRawHttpResponse(oversize);
  assertError(result, 'response', 'size limit', 'oversize response');
  assert.equal(
    result.parsed,
    undefined,
    'no parsed result for oversize response',
  );
}

// ---------------------------------------------------------------------------
// Oversize input — exchange (both inputs independently checked)
// ---------------------------------------------------------------------------

{
  const validReq = 'GET / HTTP/1.1\r\nHost: x\r\n\r\n';
  const oversizeRes = 'C'.repeat(MAX_RAW_HTTP_INPUT_BYTES + 1);
  const result = parseRawHttpExchange(validReq, oversizeRes);
  assert.ok(result.request, 'request parsed despite oversize response');
  assertError(
    result,
    'response',
    'size limit',
    'oversize response in exchange',
  );
}

console.log('httpParser response tests passed');
