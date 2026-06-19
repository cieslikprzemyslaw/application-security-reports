import {
  OWASP_TOP_10_CURRENT_VERSION,
  getOwaspTop10CategoryByValue,
} from '~/domain';

interface ThreatOwaspCategorySource {
  customCategory?: string;
  owaspCategoryCode?: string;
}

export const getThreatOwaspCategoryLabel = (
  threat: ThreatOwaspCategorySource,
  owaspTaxonomyVersion: string = OWASP_TOP_10_CURRENT_VERSION,
) => {
  const customCategory = threat.customCategory?.trim();

  if (customCategory?.length) {
    return customCategory;
  }

  const categoryCode = threat.owaspCategoryCode?.trim();

  if (!categoryCode) {
    return '—';
  }

  const category = getOwaspTop10CategoryByValue(
    categoryCode,
    owaspTaxonomyVersion,
  );

  return category ? `${category.value} - ${category.label}` : categoryCode;
};
