import {
  OWASP_TOP_10_CURRENT_VERSION,
  getOwaspTop10CategoryOption,
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

  return (
    getOwaspTop10CategoryOption(categoryCode, owaspTaxonomyVersion)?.label ??
    categoryCode
  );
};
