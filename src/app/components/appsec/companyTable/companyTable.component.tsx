import React from 'react';

import SeverityBadge from '~/app/components/ui/severityBadge';

import StyledCompanyTable, {
  CompanyApplications,
  CompanyChevron,
  CompanyIdentity,
  CompanyInitials,
  CompanyLink,
  CompanyName,
  CompanyTableCell,
  CompanyTableElement,
  CompanyTableHead,
  CompanyTableHeaderCell,
  CompanyTableRowStyled,
  OpenThreatsBadge,
} from './companyTable.styled';

import type { CompanyTableProps } from './companyTable.type';

const CompanyTable = ({ companies, onCompanyClick }: CompanyTableProps) => (
  <StyledCompanyTable>
    <CompanyTableElement>
      <CompanyTableHead>
        <tr>
          <CompanyTableHeaderCell>Company</CompanyTableHeaderCell>

          <CompanyTableHeaderCell>Website</CompanyTableHeaderCell>

          <CompanyTableHeaderCell>Primary contact</CompanyTableHeaderCell>

          <CompanyTableHeaderCell>Assessments</CompanyTableHeaderCell>

          <CompanyTableHeaderCell>Open threats</CompanyTableHeaderCell>

          <CompanyTableHeaderCell>Risk posture</CompanyTableHeaderCell>

          <CompanyTableHeaderCell aria-label="Open company" />
        </tr>
      </CompanyTableHead>

      <tbody>
        {companies.map(company => (
          <CompanyTableRowStyled
            key={company.id}
            $isClickable={Boolean(onCompanyClick)}
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
            <CompanyTableCell>
              <CompanyIdentity>
                <CompanyInitials $tone={company.logoTone ?? 'blue'}>
                  {company.initials}
                </CompanyInitials>

                <div>
                  <CompanyName>{company.name}</CompanyName>

                  <CompanyApplications>
                    {company.applicationCount}{' '}
                    {company.applicationCount === 1
                      ? 'application'
                      : 'applications'}
                  </CompanyApplications>
                </div>
              </CompanyIdentity>
            </CompanyTableCell>

            <CompanyTableCell>
              <CompanyLink
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
              </CompanyLink>
            </CompanyTableCell>

            <CompanyTableCell>
              <CompanyLink
                href={`mailto:${company.primaryContact}`}
                onClick={event => event.stopPropagation()}
              >
                {company.primaryContact}
              </CompanyLink>
            </CompanyTableCell>

            <CompanyTableCell>{company.assessmentCount}</CompanyTableCell>

            <CompanyTableCell>
              <OpenThreatsBadge $count={company.openThreats}>
                {company.openThreats} open
              </OpenThreatsBadge>
            </CompanyTableCell>

            <CompanyTableCell>
              <SeverityBadge severity={company.riskPosture} size="small" />
            </CompanyTableCell>

            <CompanyTableCell>
              <CompanyChevron aria-hidden="true">›</CompanyChevron>
            </CompanyTableCell>
          </CompanyTableRowStyled>
        ))}
      </tbody>
    </CompanyTableElement>
  </StyledCompanyTable>
);

export default CompanyTable;
