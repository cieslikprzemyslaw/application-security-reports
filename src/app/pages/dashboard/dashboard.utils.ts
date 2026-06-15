import type { CompanyListItem } from '~/domain';

import {
  readRecentCompanyIds,
  readRecentCompanyOpenTimes,
} from '~/app/layouts/sidebar/companySwitcher.utils';

import type { RecentCompanyItem } from './dashboard.type';

export const recentCompanyLimit = 5;

export const orderRecentCompanies = (companies: CompanyListItem[]) => {
  const recentCompanyIds = readRecentCompanyIds();
  const companiesById = new Map(
    companies.map(company => [company.id, company]),
  );

  const recentCompanies = recentCompanyIds
    .map(companyId => companiesById.get(companyId))
    .filter((company): company is CompanyListItem => Boolean(company));

  const remainingCompanies = companies.filter(
    company => !recentCompanyIds.includes(company.id),
  );

  return [...recentCompanies, ...remainingCompanies].slice(
    0,
    recentCompanyLimit,
  );
};

export const enrichRecentCompanies = (
  companies: CompanyListItem[],
): RecentCompanyItem[] => {
  const recentCompanyOpenTimes = readRecentCompanyOpenTimes();

  return orderRecentCompanies(companies).map(company => ({
    ...company,
    lastOpenedAt: recentCompanyOpenTimes[company.id],
  }));
};

export const formatRelativeTime = (value?: string) => {
  if (!value) {
    return '—';
  }

  const timestamp = new Date(value).getTime();

  if (Number.isNaN(timestamp)) {
    return '—';
  }

  const elapsedMinutes = Math.round((Date.now() - timestamp) / 60000);

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
