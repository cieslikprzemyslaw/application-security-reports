import assert from 'node:assert/strict';

import {
  formatCount,
  formatDate,
  formatDateTime,
  formatFileSize,
  formatReportVersion,
  formatRelativeTime,
  formatWithMissingValue,
} from './formatters';

await (async () => {
  assert.equal(formatDate(), '—');
  assert.equal(formatDate('   '), '—');
  assert.equal(formatDate('not-a-date'), 'Invalid date');
  assert.equal(
    formatDate('2026-06-14T16:45:00.000Z'),
    new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(
      new Date('2026-06-14T16:45:00.000Z'),
    ),
  );

  assert.equal(formatDateTime(), '—');
  assert.equal(formatDateTime('not-a-date'), 'Invalid date');
  assert.equal(
    formatDateTime('2026-06-14T16:45:00.000Z'),
    new Intl.DateTimeFormat(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date('2026-06-14T16:45:00.000Z')),
  );

  assert.equal(formatRelativeTime(), '—');
  assert.equal(formatRelativeTime('not-a-date'), 'Invalid relative time');
  assert.equal(
    formatRelativeTime(
      '2026-06-21T10:00:00.000Z',
      Date.parse('2026-06-21T10:00:00.000Z'),
    ),
    'just now',
  );

  assert.equal(formatFileSize(), '—');
  assert.equal(formatFileSize(-1), 'Invalid file size');
  assert.equal(formatFileSize(Number.NaN), 'Invalid file size');
  assert.equal(formatFileSize(0), '0 B');
  assert.equal(formatFileSize(1024), '1.0 KB');
  assert.equal(formatFileSize(1024 * 1024), '1.0 MB');

  assert.equal(formatCount(), '—');
  assert.equal(formatCount(-1), 'Invalid count');
  assert.equal(formatCount(1.5), 'Invalid count');
  assert.equal(
    formatCount(1234),
    new Intl.NumberFormat(undefined).format(1234),
  );

  assert.equal(formatWithMissingValue(), '—');
  assert.equal(formatWithMissingValue('   '), '—');
  assert.equal(
    formatWithMissingValue('Northstar Digital'),
    'Northstar Digital',
  );

  assert.equal(formatReportVersion(), '—');
  assert.equal(formatReportVersion('0.1.0'), 'Version 0.1.0');
})();
