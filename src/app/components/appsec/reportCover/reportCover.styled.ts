import styled from 'styled-components';

import type { RiskLevel } from '~/app/types/pageShared.type';

const StyledReportCover = styled.article.attrs({ className: 'report-cover' })`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xl};

  width: 100%;
`;

export const BrandRow = styled.div.attrs({
  className: 'report-cover-brand-row',
})`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing.l};

  padding-bottom: ${({ theme }) => theme.spacing.m};

  border-bottom: 1px solid ${({ theme }) => theme.colors.border.subtle};
`;

export const Brand = styled.div.attrs({ className: 'report-cover-brand' })`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.s};
`;

export const Logo = styled.div.attrs({ className: 'report-cover-logo' })`
  display: inline-flex;
  align-items: center;
  justify-content: center;

  min-width: 3rem;
  min-height: 3rem;

  img,
  svg {
    display: block;
    max-width: 8rem;
    max-height: 3rem;
  }
`;

export const BrandName = styled.strong.attrs({
  className: 'report-cover-brand-name',
})`
  display: block;

  font-size: ${({ theme }) => theme.typography.headings.h6.size};

  color: ${({ theme }) => theme.colors.text.primary};
`;

export const BrandMeta = styled.span.attrs({
  className: 'report-cover-brand-meta',
})`
  display: block;
  margin-top: 0.125rem;

  color: ${({ theme }) => theme.colors.text.muted};
`;

export const Confidential = styled.div.attrs({
  className: 'report-cover-confidential',
})`
  text-align: right;

  strong {
    display: block;

    color: ${({ theme }) => theme.colors.feedback.error};

    text-transform: uppercase;
    letter-spacing: 0.08em;
  }

  span {
    display: block;
    margin-top: 0.125rem;

    color: ${({ theme }) => theme.colors.text.secondary};
  }
`;

export const Eyebrow = styled.p.attrs({ className: 'report-cover-eyebrow' })`
  color: ${({ theme }) => theme.colors.brand.primary};

  font-weight: ${({ theme }) => theme.typography.fontWeights.semibold};

  text-transform: uppercase;
  letter-spacing: 0.12em;
`;

export const Title = styled.h1.attrs({ className: 'report-cover-title' })`
  margin-top: ${({ theme }) => theme.spacing.xxs};

  font-size: ${({ theme }) => theme.typography.headings.h1.size};

  line-height: ${({ theme }) => theme.typography.headings.h1.lineHeight};
`;

export const Subtitle = styled.p.attrs({ className: 'report-cover-subtitle' })`
  margin-top: ${({ theme }) => theme.spacing.s};

  color: ${({ theme }) => theme.colors.text.secondary};
`;

export const MetaGrid = styled.dl.attrs({
  className: 'report-cover-meta-grid',
})`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));

  margin: 0;

  border: 1px solid ${({ theme }) => theme.colors.border.subtle};

  border-radius: ${({ theme }) => theme.radii.md};

  overflow: hidden;
`;

export const MetaItem = styled.div.attrs({
  className: 'report-cover-meta-item',
})`
  min-width: 0;
  padding: ${({ theme }) => theme.spacing.s};

  border-right: 1px solid ${({ theme }) => theme.colors.border.subtle};

  border-bottom: 1px solid ${({ theme }) => theme.colors.border.subtle};

  &:nth-child(4n) {
    border-right: 0;
  }

  &:nth-last-child(-n + 4) {
    border-bottom: 0;
  }
`;

export const MetaLabel = styled.dt.attrs({
  className: 'report-cover-meta-label',
})`
  font-size: ${({ theme }) => theme.typography.label.small.size};

  color: ${({ theme }) => theme.colors.text.muted};

  text-transform: uppercase;
  letter-spacing: 0.04em;
`;

export const MetaValue = styled.dd.attrs({
  className: 'report-cover-meta-value',
})`
  margin: 0.25rem 0 0;

  font-weight: ${({ theme }) => theme.typography.fontWeights.semibold};

  color: ${({ theme }) => theme.colors.text.primary};
`;

export const Section = styled.section.attrs({
  className: 'report-cover-section',
})`
  break-inside: avoid;
`;

export const SectionTitle = styled.h2.attrs({
  className: 'report-cover-section-title',
})`
  padding-bottom: ${({ theme }) => theme.spacing.xxs};

  border-bottom: 2px solid ${({ theme }) => theme.colors.brand.primary};

  font-size: ${({ theme }) => theme.typography.headings.h4.size};
`;

export const SummaryBox = styled.div.attrs({
  className: 'report-cover-summary-box',
})`
  display: grid;
  grid-template-columns: 8rem minmax(0, 1fr);
  gap: ${({ theme }) => theme.spacing.s};

  margin-top: ${({ theme }) => theme.spacing.s};

  padding: ${({ theme }) => theme.spacing.s};

  border: 1px solid ${({ theme }) => theme.colors.border.subtle};

  border-radius: ${({ theme }) => theme.radii.md};

  background-color: ${({ theme }) => theme.colors.neutral.grey50};
`;

export const RiskBox = styled.div.attrs({
  className: 'report-cover-risk-box',
})<{
  $risk: RiskLevel;
}>`
  display: flex;
  flex-direction: column;
  justify-content: center;

  padding: ${({ theme }) => theme.spacing.s};

  border-radius: ${({ theme }) => theme.radii.md};

  color: ${({ theme, $risk }) =>
    theme.colors.severity[
      $risk.toLowerCase() as
        | 'critical'
        | 'high'
        | 'medium'
        | 'low'
        | 'informational'
    ].text};

  background-color: ${({ theme, $risk }) =>
    theme.colors.severity[
      $risk.toLowerCase() as
        | 'critical'
        | 'high'
        | 'medium'
        | 'low'
        | 'informational'
    ].background};

  border: 1px solid
    ${({ theme, $risk }) =>
      theme.colors.severity[
        $risk.toLowerCase() as
          | 'critical'
          | 'high'
          | 'medium'
          | 'low'
          | 'informational'
      ].solid};

  span {
    font-size: ${({ theme }) => theme.typography.label.small.size};

    text-transform: uppercase;
  }

  strong {
    margin-top: 0.25rem;

    font-size: ${({ theme }) => theme.typography.headings.h3.size};
  }
`;

export const ScopeList = styled.ul.attrs({
  className: 'report-cover-scope-list',
})`
  margin: ${({ theme }) => theme.spacing.s} 0 0;

  padding-left: 1.25rem;

  color: ${({ theme }) => theme.colors.text.secondary};
`;

export const FindingsList = styled.div.attrs({
  className: 'report-cover-findings-list',
})`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.l};

  margin-top: ${({ theme }) => theme.spacing.s};
`;

export const Finding = styled.article.attrs({
  className: 'report-cover-finding',
})`
  break-inside: avoid;

  padding: ${({ theme }) => theme.spacing.m};

  border: 1px solid ${({ theme }) => theme.colors.border.subtle};

  border-radius: ${({ theme }) => theme.radii.md};
`;

export const FindingHeader = styled.div.attrs({
  className: 'report-cover-finding-header',
})`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing.s};

  margin-bottom: ${({ theme }) => theme.spacing.s};
`;

export const FindingTitle = styled.h3.attrs({
  className: 'report-cover-finding-title',
})`
  font-size: ${({ theme }) => theme.typography.headings.h5.size};
`;

export const FindingGrid = styled.div.attrs({
  className: 'report-cover-finding-grid',
})`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: ${({ theme }) => theme.spacing.s};
`;

export const FindingSection = styled.div.attrs({
  className: 'report-cover-finding-section',
})`
  h4 {
    margin-bottom: 0.25rem;

    font-size: ${({ theme }) => theme.typography.headings.h6.size};
  }

  p,
  div {
    color: ${({ theme }) => theme.colors.text.secondary};
  }
`;

export const Footer = styled.footer.attrs({ className: 'report-cover-footer' })`
  padding-top: ${({ theme }) => theme.spacing.s};

  border-top: 1px solid ${({ theme }) => theme.colors.border.subtle};

  color: ${({ theme }) => theme.colors.text.muted};

  text-align: center;
`;

export default StyledReportCover;
