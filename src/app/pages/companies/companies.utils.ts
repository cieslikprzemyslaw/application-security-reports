import type { Company, CompanyListItem } from '~/domain';

import type {
  CompanyTableRow,
  CompanyLogoTone,
} from '~/app/components/appsec/companyTable';

import type { CompanyFormValue } from '~/app/components/appsec/companyForm';

const logoTones: CompanyLogoTone[] = [
  'blue',
  'cyan',
  'orange',
  'green',
  'purple',
  'slate',
];

const normalizeText = (value?: string) => value?.trim() ?? '';

export const createEmptyCompanyFormValue = (): CompanyFormValue => ({
  name: '',
  description: '',
  website: '',
  contactName: '',
  contactEmail: '',
  footerText: '',
  logoFile: null,
  hasExistingLogo: false,
});

export const companyToFormValue = (
  company?: Company | CompanyListItem,
): CompanyFormValue => ({
  name: company?.name ?? '',
  description: company?.description ?? '',
  website: company?.website ?? '',
  contactName: company?.contactName ?? '',
  contactEmail: company?.contactEmail ?? '',
  footerText: company?.footerText ?? '',
  logoFile: null,
  hasExistingLogo: Boolean(company?.logoUrl),
});

export const normalizeCompanyWebsite = (value: string) => {
  const trimmed = normalizeText(value);

  if (trimmed.length === 0) {
    return undefined;
  }

  if (/^[a-z][a-z\d+\-.]*:\/\//i.test(trimmed)) {
    return trimmed;
  }

  return `https://${trimmed}`;
};

export const formValueToCompanyInput = (value: CompanyFormValue) => {
  const normalizedDescription = normalizeText(value.description);
  const normalizedContactName = normalizeText(value.contactName);
  const normalizedContactEmail = normalizeText(value.contactEmail);
  const normalizedFooterText = normalizeText(value.footerText);

  return {
    name: value.name.trim(),
    description:
      normalizedDescription.length > 0 ? normalizedDescription : undefined,
    website: normalizeCompanyWebsite(value.website),
    contactName:
      normalizedContactName.length > 0 ? normalizedContactName : undefined,
    contactEmail:
      normalizedContactEmail.length > 0 ? normalizedContactEmail : undefined,
    footerText:
      normalizedFooterText.length > 0 ? normalizedFooterText : undefined,
  };
};

export const getCompanyInitials = (name: string) => {
  const trimmed = normalizeText(name);

  if (trimmed.length === 0) {
    return '??';
  }

  const words = trimmed.split(/\s+/).filter(Boolean);
  const initials =
    words.length > 1
      ? words
          .slice(0, 2)
          .map(word => word[0])
          .join('')
      : trimmed.slice(0, 2);

  return initials.toUpperCase();
};

export const getCompanyLogoTone = (name: string): CompanyLogoTone => {
  const trimmed = normalizeText(name);
  const hash = [...trimmed].reduce(
    (total, character) => total + character.charCodeAt(0),
    0,
  );

  return logoTones[hash % logoTones.length];
};

export const companyToTableRow = (
  company: CompanyListItem,
): CompanyTableRow => ({
  id: company.id,
  name: company.name,
  initials: getCompanyInitials(company.name),
  logoTone: getCompanyLogoTone(company.name),
  applicationCount: company.assessmentCount,
  website: company.website ?? '',
  primaryContact: company.contactEmail ?? company.contactName ?? '',
  assessmentCount: company.assessmentCount,
  openThreats: 0,
  riskPosture: 'informational',
});

export const areCompanyFormValuesEqual = (
  left: CompanyFormValue,
  right: CompanyFormValue,
) =>
  left.name === right.name &&
  left.description === right.description &&
  left.website === right.website &&
  left.contactName === right.contactName &&
  left.contactEmail === right.contactEmail &&
  left.footerText === right.footerText &&
  left.logoFile === right.logoFile &&
  left.hasExistingLogo === right.hasExistingLogo;
