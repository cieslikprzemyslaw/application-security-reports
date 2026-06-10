import styled from 'styled-components';

const StyledReportHeader = styled.header.attrs({ className: 'report-header' })`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.l};

  padding-bottom: ${({ theme }) => theme.spacing.l};

  border-bottom: 2px solid ${({ theme }) => theme.colors.border.strong};
`;

export const ReportBrandRow = styled.div.attrs({
  className: 'report-header-report-brand-row',
})`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing.m};
`;

export const ReportCompany = styled.div.attrs({
  className: 'report-header-report-company',
})`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.s};
`;

export const ReportLogo = styled.div.attrs({
  className: 'report-header-report-logo',
})`
  display: inline-flex;
  align-items: center;
  justify-content: center;

  max-width: 10rem;
  max-height: 3rem;
`;

export const ReportCompanyName = styled.strong.attrs({
  className: 'report-header-report-company-name',
})`
  color: ${({ theme }) => theme.colors.text.primary};
`;

export const ReportMeta = styled.dl.attrs({
  className: 'report-header-report-meta',
})`
  margin: 0;

  font-size: ${({ theme }) => theme.typography.body.small.size};

  color: ${({ theme }) => theme.colors.text.muted};

  text-align: right;
`;

export const ReportMetaRow = styled.div.attrs({
  className: 'report-header-report-meta-row',
})`
  display: grid;
  grid-template-columns:
    auto
    auto;
  gap: ${({ theme }) => theme.spacing.xxs};
`;

export const ReportMetaLabel = styled.dt.attrs({
  className: 'report-header-report-meta-label',
})`
  font-weight: ${({ theme }) => theme.typography.fontWeights.medium};
`;

export const ReportMetaValue = styled.dd.attrs({
  className: 'report-header-report-meta-value',
})`
  margin: 0;
`;

export const ReportTitleGroup = styled.div.attrs({
  className: 'report-header-report-title-group',
})`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xxxs};
`;

export const ReportTitle = styled.h1.attrs({
  className: 'report-header-report-title',
})`
  font-size: ${({ theme }) => theme.typography.headings.h2.size};

  line-height: ${({ theme }) => theme.typography.headings.h2.lineHeight};
`;

export const ReportSubtitle = styled.p.attrs({
  className: 'report-header-report-subtitle',
})`
  color: ${({ theme }) => theme.colors.text.secondary};
`;

export default StyledReportHeader;
