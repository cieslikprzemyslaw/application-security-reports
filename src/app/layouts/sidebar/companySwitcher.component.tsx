import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import type { CompanyListItem } from '~/domain';
import Button from '~/app/components/ui/button';
import Drawer from '~/app/components/ui/drawer';
import EmptyState from '~/app/components/ui/emptyState';
import IconSVG from '~/app/components/ui/iconSVG';
import SearchInput from '~/app/components/ui/searchInput';
import { routes } from '~/routes';

import StyledCompanySwitcher from './companySwitcher.styled';
import {
  filterCompanySwitcherCompanies,
  readRecentCompanyIds,
  updateRecentCompanyIds,
  writeRecentCompanyIds,
} from './companySwitcher.utils';

const formatAssessmentCount = (assessmentCount?: number) => {
  if (typeof assessmentCount !== 'number') {
    return 'Assessment count unavailable';
  }

  return `${assessmentCount} ${
    assessmentCount === 1 ? 'assessment' : 'assessments'
  }`;
};

export interface CompanySwitcherProps {
  activeCompany?: {
    id: string;
    name: string;
  };
  companies: CompanyListItem[];
  isLoading?: boolean;
  onActiveCompanyChange: (company?: { id: string; name: string }) => void;
}

const CompanySwitcher = ({
  activeCompany,
  companies,
  isLoading = false,
  onActiveCompanyChange,
}: CompanySwitcherProps) => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [storedRecentCompanyIds, setStoredRecentCompanyIds] = useState<
    string[]
  >(() => readRecentCompanyIds());

  const activeCompanyId = activeCompany?.id;

  const recentCompanyIds = useMemo(() => {
    if (!activeCompanyId) {
      return storedRecentCompanyIds;
    }

    return updateRecentCompanyIds(storedRecentCompanyIds, activeCompanyId);
  }, [activeCompanyId, storedRecentCompanyIds]);

  useEffect(() => {
    writeRecentCompanyIds(recentCompanyIds);
  }, [recentCompanyIds]);

  const closeSwitcher = () => {
    setIsOpen(false);
    setSearchValue('');
  };

  const visibleCompanies = useMemo(
    () =>
      filterCompanySwitcherCompanies(companies, recentCompanyIds, searchValue),
    [companies, recentCompanyIds, searchValue],
  );

  const handleSelectCompany = (company: CompanyListItem) => {
    const nextRecentCompanyIds = updateRecentCompanyIds(
      recentCompanyIds,
      company.id,
    );

    setStoredRecentCompanyIds(nextRecentCompanyIds);
    closeSwitcher();

    onActiveCompanyChange({
      id: company.id,
      name: company.name,
    });
  };

  const handleViewAll = () => {
    closeSwitcher();
    navigate(routes.companies);
  };

  const handleCreateCompany = () => {
    closeSwitcher();
    navigate(routes.companiesNew);
  };

  const showEmptyWorkspace = !isLoading && companies.length === 0;
  const hasSearch = searchValue.trim().length > 0;
  const triggerLabel = showEmptyWorkspace
    ? 'Create company'
    : (activeCompany?.name ?? 'Select company');
  const hasCompanies = companies.length > 0;

  return (
    <>
      <button
        className={[
          'sidebar-company-switcher',
          isOpen ? 'sidebar-company-switcher--active' : '',
        ]
          .filter(Boolean)
          .join(' ')}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        onClick={() => setIsOpen(true)}
      >
        {' '}
        <span className="sidebar-company-switcher-icon" aria-hidden="true">
          {' '}
          <IconSVG name="company" />{' '}
        </span>
        <span className="sidebar-company-switcher-text">
          <span className="sidebar-company-switcher-label">Company</span>
          <span className="sidebar-company-switcher-name">{triggerLabel}</span>
        </span>
        <IconSVG name="chevronDown" aria-hidden="true" />
      </button>

      <Drawer
        isOpen={isOpen}
        title="Switch company"
        description="Choose a company to open its overview and workspace data."
        onClose={closeSwitcher}
        closeLabel="Close company switcher"
      >
        <StyledCompanySwitcher>
          {isLoading ? (
            <div
              className="company-switcher-status"
              role="status"
              aria-live="polite"
            >
              Loading companies...
            </div>
          ) : showEmptyWorkspace ? (
            <EmptyState
              title="No companies yet"
              description="Create your first company to start switching workspaces."
              primaryAction={
                <Button title="Create company" onClick={handleCreateCompany} />
              }
            />
          ) : (
            <>
              <SearchInput
                label="Search companies"
                placeholder="Search companies..."
                value={searchValue}
                onChange={event => setSearchValue(event.target.value)}
                onClear={() => setSearchValue('')}
              />

              <div className="company-switcher-status">
                {hasSearch ? 'Matching companies' : 'Recent companies'}
              </div>

              {visibleCompanies.length > 0 ? (
                <ul className="company-switcher-list">
                  {visibleCompanies.map(company => {
                    const isCurrentCompany = activeCompanyId === company.id;

                    return (
                      <li key={company.id} className="company-switcher-item">
                        <button
                          type="button"
                          className={[
                            'company-switcher-item-button',
                            isCurrentCompany
                              ? 'company-switcher-item-button--active'
                              : '',
                          ]
                            .filter(Boolean)
                            .join(' ')}
                          onClick={() => handleSelectCompany(company)}
                        >
                          <span
                            className="company-switcher-item-icon"
                            aria-hidden="true"
                          >
                            <IconSVG name="company" />
                          </span>

                          <span className="company-switcher-item-content">
                            <span className="company-switcher-item-name">
                              {company.name}
                            </span>

                            <span className="company-switcher-item-meta">
                              {formatAssessmentCount(company.assessmentCount)}
                            </span>
                          </span>

                          {isCurrentCompany && (
                            <span className="company-switcher-item-badge">
                              Current
                            </span>
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <EmptyState
                  title={
                    searchValue.trim().length > 0
                      ? `No companies match "${searchValue.trim()}"`
                      : 'No recent companies yet'
                  }
                  description={
                    searchValue.trim().length > 0
                      ? 'Clear the search to show recent companies again.'
                      : 'Select a company to add it to your recent list.'
                  }
                  primaryAction={
                    searchValue.trim().length > 0 ? (
                      <Button
                        title="Clear search"
                        variant="secondary"
                        onClick={() => setSearchValue('')}
                      />
                    ) : undefined
                  }
                />
              )}

              {hasCompanies && (
                <div className="company-switcher-actions">
                  <Button
                    title="View all"
                    variant="tertiary"
                    className="company-switcher-actions-link"
                    onClick={handleViewAll}
                  />

                  <Button
                    title="Create company"
                    onClick={handleCreateCompany}
                  />
                </div>
              )}
            </>
          )}
        </StyledCompanySwitcher>
      </Drawer>
    </>
  );
};

export default CompanySwitcher;
