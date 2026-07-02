const missingDisplayValue = '—';

const invalidDateDisplayValue = 'Invalid date';
const invalidRelativeTimeDisplayValue = 'Invalid relative time';
const invalidFileSizeDisplayValue = 'Invalid file size';
const invalidCountDisplayValue = 'Invalid count';

const dateOnlyPattern = /^(\d{4})-(\d{2})-(\d{2})$/;

const hasText = (value?: string | null): value is string =>
  typeof value === 'string' && value.trim().length > 0;

const isValidNumber = (value?: number | null) =>
  typeof value === 'number' && Number.isFinite(value);

const formatDateOnly = (value: string) => {
  const match = dateOnlyPattern.exec(value.trim());

  if (!match) {
    return undefined;
  }

  const [, year, month, day] = match;
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));

  if (
    date.getUTCFullYear() !== Number(year) ||
    date.getUTCMonth() !== Number(month) - 1 ||
    date.getUTCDate() !== Number(day)
  ) {
    return invalidDateDisplayValue;
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeZone: 'UTC',
  }).format(date);
};

export const formatDate = (value?: string | null) => {
  if (!hasText(value)) {
    return missingDisplayValue;
  }

  const dateOnlyValue = formatDateOnly(value);

  if (dateOnlyValue) {
    return dateOnlyValue;
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? invalidDateDisplayValue
    : new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(date);
};

export const formatDateRange = (
  startedAt?: string | null,
  completedAt?: string | null,
) => {
  const start = formatDate(startedAt);
  const end = formatDate(completedAt);

  if (start === missingDisplayValue && end === missingDisplayValue) {
    return missingDisplayValue;
  }

  if (start === missingDisplayValue) {
    return end;
  }

  if (end === missingDisplayValue) {
    return start;
  }

  return `${start} to ${end}`;
};

export const formatDateTime = (value?: string | null) => {
  if (!hasText(value)) {
    return missingDisplayValue;
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? invalidDateDisplayValue
    : new Intl.DateTimeFormat(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(date);
};

export const formatRelativeTime = (value?: string | null, now = Date.now()) => {
  if (!hasText(value)) {
    return missingDisplayValue;
  }

  const timestamp = new Date(value).getTime();

  if (Number.isNaN(timestamp)) {
    return invalidRelativeTimeDisplayValue;
  }

  const elapsedMinutes = Math.round((now - timestamp) / 60000);

  if (elapsedMinutes < 1) {
    return 'just now';
  }

  if (elapsedMinutes < 60) {
    return `${elapsedMinutes}m ago`;
  }

  const elapsedHours = Math.round(elapsedMinutes / 60);

  if (elapsedHours < 24) {
    return `${elapsedHours}h ago`;
  }

  const elapsedDays = Math.round(elapsedHours / 24);

  return `${elapsedDays}d ago`;
};

export const formatFileSize = (value?: number | null) => {
  if (value === undefined || value === null) {
    return missingDisplayValue;
  }

  if (!isValidNumber(value) || value < 0) {
    return invalidFileSizeDisplayValue;
  }

  if (value < 1024) {
    return `${value} B`;
  }

  if (value < 1024 * 1024) {
    return `${(value / 1024).toFixed(1)} KB`;
  }

  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
};

export const formatCount = (value?: number | null) => {
  if (value === undefined || value === null) {
    return missingDisplayValue;
  }

  if (!Number.isInteger(value) || value < 0) {
    return invalidCountDisplayValue;
  }

  return new Intl.NumberFormat(undefined).format(value);
};

export const formatWithMissingValue = (
  value?: string | null,
  fallback = missingDisplayValue,
) => {
  const trimmed = value?.trim();

  return trimmed && trimmed.length > 0 ? trimmed : fallback;
};

export const formatReportVersion = (value?: string | null) => {
  const displayValue = formatWithMissingValue(value);

  return displayValue === missingDisplayValue
    ? missingDisplayValue
    : `Version ${displayValue}`;
};
