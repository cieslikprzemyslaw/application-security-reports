import React from 'react';

import SeverityBadge from '~/app/components/ui/severityBadge';

import StyledCompanyTable from './companyTable.styled';

import type { CompanyTableProps } from './companyTable.type';

const CompanyTable = ({
  companies,
  onCompanyClick,
  emptyState,
}: CompanyTableProps) => (
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
          <th
            className="company-table__header-cell"
            aria-label="Open company"
          />
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

        {companies.map(company => (
          <tr
            key={company.id}
            className={[
              'company-table__row',
              onCompanyClick ? 'company-table__row--clickable' : '',
            ]
              .filter(Boolean)
              .join(' ')}
            tabIndex={onCompanyClick ? 0 : undefined}
            onClick={() => onCompanyClick?.(company)}
            onKeyDown={event => {
              if (
                onCompanyClick &&
                (event.key === 'Enter' || event.key === ' ')
              ) {
                event.preventDefault();
                onCompanyClick(company);
              }
            }}
          >
            <td className="company-table__cell">
              <div className="company-table__identity">
                <span
                  className={[
                    'company-table__initials',
                    `company-table__initials--${company.logoTone ?? 'blue'}`,
                  ].join(' ')}
                >
                  {company.initials}
                </span>

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

            <td className="company-table__cell">{company.assessmentCount}</td>

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

            <td className="company-table__cell">
              <span className="company-table__chevron" aria-hidden="true">
                ›
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </StyledCompanyTable>
);

export default CompanyTable;
