import {
  readRecentCompanyIds,
  readRecentCompanyOpenTimes,
} from '~/app/layouts/sidebar/companySwitcher.utils';
import { formatRelativeTime } from '~/app/utils/formatters';

import type { RecentCompanyItem } from './dashboard.type';

export const recentCompanyLimit = 5;

export const orderRecentCompanies = (companies: RecentCompanyItem[]) => {
  const recentCompanyIds = readRecentCompanyIds();
  const companiesById = new Map(
    companies.map(company => [company.id, company]),
  );

  const recentCompanies = recentCompanyIds
    .map(companyId => companiesById.get(companyId))
    .filter((company): company is RecentCompanyItem => Boolean(company));

  const remainingCompanies = companies.filter(
    company => !recentCompanyIds.includes(company.id),
  );

  return [...recentCompanies, ...remainingCompanies].slice(
    0,
    recentCompanyLimit,
  );
};

export const enrichRecentCompanies = (
  companies: RecentCompanyItem[],
): RecentCompanyItem[] => {
  const recentCompanyOpenTimes = readRecentCompanyOpenTimes();

  return orderRecentCompanies(companies).map(company => ({
    ...company,
    lastOpenedAt: recentCompanyOpenTimes[company.id],
  }));
};

export { formatRelativeTime };
