import type { CompanyListItem } from '~/domain';

export const companySwitcherRecentsStorageKey =
  'appsec-company-switcher-recents';

export const companySwitcherRecentLimit = 5;

export const readRecentCompanyIds = (): string[] => {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const storedValue = window.localStorage.getItem(
      companySwitcherRecentsStorageKey,
    );

    if (!storedValue) {
      return [];
    }

    const parsedValue = JSON.parse(storedValue);

    if (!Array.isArray(parsedValue)) {
      return [];
    }

    return parsedValue.filter(
      (value): value is string => typeof value === 'string' && value.length > 0,
    );
  } catch {
    return [];
  }
};

export const writeRecentCompanyIds = (companyIds: string[]) => {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(
      companySwitcherRecentsStorageKey,
      JSON.stringify(companyIds.slice(0, companySwitcherRecentLimit)),
    );
  } catch {
    // Continue with the in-memory recents list.
  }
};

export const updateRecentCompanyIds = (
  recentCompanyIds: string[],
  companyId: string,
) => {
  const nextCompanyIds = [
    companyId,
    ...recentCompanyIds.filter(id => id !== companyId),
  ];

  return nextCompanyIds.slice(0, companySwitcherRecentLimit);
};

export const filterCompanySwitcherCompanies = (
  companies: CompanyListItem[],
  recentCompanyIds: string[],
  searchValue: string,
) => {
  const query = searchValue.trim().toLowerCase();
  const filteredCompanies =
    query.length > 0
      ? companies.filter(company => company.name.toLowerCase().includes(query))
      : companies;

  const recentMatches = recentCompanyIds
    .map(companyId =>
      filteredCompanies.find(company => company.id === companyId),
    )
    .filter((company): company is CompanyListItem => Boolean(company));

  const remainingCompanies = filteredCompanies.filter(
    company => !recentCompanyIds.includes(company.id),
  );

  const orderedCompanies = [...recentMatches, ...remainingCompanies];

  return query.length > 0
    ? orderedCompanies
    : orderedCompanies.slice(0, companySwitcherRecentLimit);
};
