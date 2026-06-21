const missingDisplayValue = '—';

const invalidDateDisplayValue = 'Invalid date';
const invalidRelativeTimeDisplayValue = 'Invalid relative time';
const invalidFileSizeDisplayValue = 'Invalid file size';
const invalidCountDisplayValue = 'Invalid count';

const isMissingText = (value?: string): value is string =>
  value === undefined || value.trim().length === 0;

const isValidNumber = (value?: number) =>
  typeof value === 'number' && Number.isFinite(value);

export const formatDate = (value?: string) => {
  if (isMissingText(value)) {
    return missingDisplayValue;
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? invalidDateDisplayValue
    : new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(date);
};

export const formatDateTime = (value?: string) => {
  if (isMissingText(value)) {
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

export const formatRelativeTime = (value?: string, now = Date.now()) => {
  if (isMissingText(value)) {
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

export const formatFileSize = (value?: number) => {
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

export const formatCount = (value?: number) => {
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

export const formatReportVersion = (value?: string) => {
  const displayValue = formatWithMissingValue(value);

  return displayValue === missingDisplayValue
    ? missingDisplayValue
    : `Version ${displayValue}`;
};
