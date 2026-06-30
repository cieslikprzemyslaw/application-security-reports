import React, { useState, useEffect } from 'react';

import CompanyAvatar from '~/app/components/appsec/companyAvatar';
import IconSVG from '~/app/components/ui/iconSVG';
import SeverityBadge from '~/app/components/ui/severityBadge';

import StyledCompanyTable from './companyTable.styled';
import type { CompanyTableProps } from './companyTable.type';

const CompanyTable = ({
  companies,
  activeCompanyId,
  onCompanyClick,
  onEditCompany,
  emptyState,
}: CompanyTableProps) => {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  useEffect(() => {
    if (openMenuId === null) return undefined;

    const handleDocumentClick = () => setOpenMenuId(null);
    document.addEventListener('click', handleDocumentClick);
    return () => document.removeEventListener('click', handleDocumentClick);
  }, [openMenuId]);

  return (
    <StyledCompanyTable>
      <table className="company-table__table">
        <thead className="company-table__head">
          <tr>
            <th className="company-table__header-cell">Company</th>
            <th className="company-table__header-cell">Website</th>
            <th className="company-table__header-cell">Primary contact</th>
            <th className="company-table__header-cell">Assessments</th>
            <th className="company-table__header-cell">Open threats</th>
            <th className="company-table__header-cell">Risk posture</th>
            <th className="company-table__header-cell" aria-label="Actions" />
          </tr>
        </thead>

        <tbody>
          {companies.length === 0 && (
            <tr>
              <td className="company-table__empty-cell" colSpan={7}>
                {emptyState ?? 'No companies found.'}
              </td>
            </tr>
          )}

          {companies.map(company => {
            const isActive = company.id === activeCompanyId;
            const isMenuOpen = openMenuId === company.id;

            return (
              <tr
                key={company.id}
                className={[
                  'company-table__row',
                  onCompanyClick ? 'company-table__row--clickable' : '',
                  isActive ? 'company-table__row--active' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                tabIndex={onCompanyClick ? 0 : undefined}
                aria-current={isActive ? true : undefined}
                onClick={() => onCompanyClick?.(company)}
                onKeyDown={event => {
                  if (event.key === 'Escape' && isMenuOpen) {
                    event.stopPropagation();
                    setOpenMenuId(null);
                    return;
                  }
                  if (
                    onCompanyClick &&
                    (event.key === 'Enter' || event.key === ' ') &&
                    event.target === event.currentTarget
                  ) {
                    event.preventDefault();
                    onCompanyClick(company);
                  }
                }}
              >
                <td className="company-table__cell">
                  <div className="company-table__identity">
                    <CompanyAvatar
                      companyName={company.name}
                      initials={company.initials}
                      logoUrl={company.logoUrl}
                      tone={company.logoTone ?? 'blue'}
                      size="large"
                      isDecorative
                    />

                    <div>
                      <strong className="company-table__name">
                        {company.name}
                      </strong>

                      <span className="company-table__applications">
                        {company.applicationCount}{' '}
                        {company.applicationCount === 1
                          ? 'application'
                          : 'applications'}
                      </span>
                    </div>
                  </div>
                </td>

                <td className="company-table__cell">
                  {company.website ? (
                    <a
                      className="company-table__link"
                      href={
                        company.website.startsWith('http')
                          ? company.website
                          : `https://${company.website}`
                      }
                      target="_blank"
                      rel="noreferrer"
                      onClick={event => event.stopPropagation()}
                    >
                      {company.website.replace(/^https?:\/\//, '')}
                    </a>
                  ) : (
                    '—'
                  )}
                </td>

                <td className="company-table__cell">
                  {company.primaryContact ? (
                    company.primaryContact.includes('@') ? (
                      <a
                        className="company-table__link"
                        href={`mailto:${company.primaryContact}`}
                        onClick={event => event.stopPropagation()}
                      >
                        {company.primaryContact}
                      </a>
                    ) : (
                      company.primaryContact
                    )
                  ) : (
                    '—'
                  )}
                </td>

                <td className="company-table__cell">
                  {company.assessmentCount}
                </td>

                <td className="company-table__cell">
                  <span
                    className={[
                      'company-table__open-threats-badge',
                      company.openThreats >= 15
                        ? 'company-table__open-threats-badge--high'
                        : company.openThreats >= 10
                          ? 'company-table__open-threats-badge--medium'
                          : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                  >
                    {company.openThreats} open
                  </span>
                </td>

                <td className="company-table__cell">
                  <SeverityBadge severity={company.riskPosture} size="small" />
                </td>

                <td className="company-table__cell company-table__cell--actions">
                  <div className="company-table__menu-wrapper">
                    <button
                      type="button"
                      className="company-table__menu-button"
                      aria-label={`Actions for ${company.name}`}
                      aria-expanded={isMenuOpen}
                      aria-haspopup="menu"
                      onClick={event => {
                        event.stopPropagation();
                        setOpenMenuId(isMenuOpen ? null : company.id);
                      }}
                    >
                      <IconSVG name="more" size="small" />
                    </button>

                    {isMenuOpen && (
                      <div className="company-table__menu" role="menu">
                        <button
                          type="button"
                          className="company-table__menu-item"
                          role="menuitem"
                          onClick={event => {
                            event.stopPropagation();
                            setOpenMenuId(null);
                            onEditCompany?.(company);
                          }}
                        >
                          Edit
                        </button>
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </StyledCompanyTable>
  );
};

export default CompanyTable;
