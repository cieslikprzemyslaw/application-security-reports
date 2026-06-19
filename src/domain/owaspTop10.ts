export const OWASP_TOP_10_CURRENT_VERSION = '2025' as const;

const OWASP_TOP_10_2025_CATEGORIES = {
  A01: {
    code: 'A01',
    label: 'Broken Access Control',
    value: 'A01:2025',
  },
  A02: {
    code: 'A02',
    label: 'Security Misconfiguration',
    value: 'A02:2025',
  },
  A03: {
    code: 'A03',
    label: 'Software Supply Chain Failures',
    value: 'A03:2025',
  },
  A04: {
    code: 'A04',
    label: 'Cryptographic Failures',
    value: 'A04:2025',
  },
  A05: {
    code: 'A05',
    label: 'Injection',
    value: 'A05:2025',
  },
  A06: {
    code: 'A06',
    label: 'Insecure Design',
    value: 'A06:2025',
  },
  A07: {
    code: 'A07',
    label: 'Authentication Failures',
    value: 'A07:2025',
  },
  A08: {
    code: 'A08',
    label: 'Software or Data Integrity Failures',
    value: 'A08:2025',
  },
  A09: {
    code: 'A09',
    label: 'Security Logging & Alerting Failures',
    value: 'A09:2025',
  },
  A10: {
    code: 'A10',
    label: 'Mishandling of Exceptional Conditions',
    value: 'A10:2025',
  },
} as const;

export const OWASP_TOP_10_REGISTRY = {
  [OWASP_TOP_10_CURRENT_VERSION]: {
    categories: OWASP_TOP_10_2025_CATEGORIES,
    version: OWASP_TOP_10_CURRENT_VERSION,
  },
} as const;

type OwaspTop10Registry = typeof OWASP_TOP_10_REGISTRY;
export type OwaspTop10Version = keyof OwaspTop10Registry;
type OwaspTop10Record = OwaspTop10Registry[OwaspTop10Version];
type OwaspTop10Category =
  OwaspTop10Record['categories'][keyof OwaspTop10Record['categories']];

export interface OwaspTop10Option {
  label: string;
  value: string;
}

const getOwaspTop10Record = (
  version: string = OWASP_TOP_10_CURRENT_VERSION,
): OwaspTop10Record | undefined =>
  version in OWASP_TOP_10_REGISTRY
    ? OWASP_TOP_10_REGISTRY[version as OwaspTop10Version]
    : undefined;

export const isOwaspTop10Version = (
  version: string,
): version is OwaspTop10Version => version in OWASP_TOP_10_REGISTRY;

const toOption = (category: OwaspTop10Category): OwaspTop10Option => ({
  label: `${category.value} - ${category.label}`,
  value: category.value,
});

export const getOwaspTop10CategoryByCode = (
  code: string,
  version: string = OWASP_TOP_10_CURRENT_VERSION,
) => {
  const record = getOwaspTop10Record(version);

  if (!record) {
    return undefined;
  }

  const normalizedCode = code.trim().toUpperCase();

  return record.categories[normalizedCode as keyof typeof record.categories];
};

export const getOwaspTop10CategoryByValue = (
  value: string,
  version: string = OWASP_TOP_10_CURRENT_VERSION,
) => {
  const record = getOwaspTop10Record(version);

  if (!record) {
    return undefined;
  }

  const normalizedValue = value.trim().toUpperCase();

  return Object.values(record.categories).find(
    category => category.value === normalizedValue,
  );
};

export const getOwaspTop10CategoryOption = (
  code: string,
  version: string = OWASP_TOP_10_CURRENT_VERSION,
): OwaspTop10Option | undefined => {
  const category = getOwaspTop10CategoryByCode(code, version);

  return category ? toOption(category) : undefined;
};

export const getOwaspTop10CategoryOptions = (
  version: string = OWASP_TOP_10_CURRENT_VERSION,
): OwaspTop10Option[] => {
  const record = getOwaspTop10Record(version);

  return record ? Object.values(record.categories).map(toOption) : [];
};

export const OWASP_TOP_10_OPTIONS = getOwaspTop10CategoryOptions();
