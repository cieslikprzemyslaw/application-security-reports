import styled from 'styled-components';

const StyledAssessmentSummary = styled.section.attrs({
  className: 'assessment-summary',
})`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.m};

  padding: ${({ theme }) => theme.spacing.m};

  border: 1px solid ${({ theme }) => theme.colors.border.subtle};

  border-radius: ${({ theme }) => theme.radii.lg};

  background-color: ${({ theme }) => theme.colors.surface.card};

  box-shadow: ${({ theme }) => theme.shadows.xs};
`;

export const AssessmentSummaryHeader = styled.div.attrs({
  className: 'assessment-summary-header',
})`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.s};

  @media ${({ theme }) => theme.mq.min.tablet} {
    flex-direction: row;
    align-items: flex-start;
    justify-content: space-between;
  }
`;

export const AssessmentIdentity = styled.div.attrs({
  className: 'assessment-summary-assessment-identity',
})`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.s};
`;

export const CompanyLogo = styled.div.attrs({
  className: 'assessment-summary-company-logo',
})`
  display: inline-flex;
  align-items: center;
  justify-content: center;

  width: 3rem;
  height: 3rem;
  overflow: hidden;

  border: 1px solid ${({ theme }) => theme.colors.border.subtle};

  border-radius: ${({ theme }) => theme.radii.md};

  background-color: ${({ theme }) => theme.colors.surface.subtle};
`;

export const AssessmentTitleGroup = styled.div.attrs({
  className: 'assessment-summary-assessment-title-group',
})`
  min-width: 0;
`;

export const CompanyName = styled.p.attrs({
  className: 'assessment-summary-company-name',
})`
  color: ${({ theme }) => theme.colors.text.muted};
`;

export const ApplicationName = styled.h2.attrs({
  className: 'assessment-summary-application-name',
})`
  font-size: ${({ theme }) => theme.typography.headings.h4.size};

  line-height: ${({ theme }) => theme.typography.headings.h4.lineHeight};
`;

export const AssessmentBadges = styled.div.attrs({
  className: 'assessment-summary-assessment-badges',
})`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.xxs};
`;

export const AssessmentMetadataGrid = styled.dl.attrs({
  className: 'assessment-summary-assessment-metadata-grid',
})`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(10rem, 1fr));
  gap: ${({ theme }) => theme.spacing.s};

  margin: 0;
  padding-top: ${({ theme }) => theme.spacing.s};

  border-top: 1px solid ${({ theme }) => theme.colors.border.subtle};
`;

export const AssessmentMetadataItemStyled = styled.div.attrs({
  className: 'assessment-summary-assessment-metadata-item-styled',
})`
  min-width: 0;
`;

export const AssessmentMetadataLabel = styled.dt.attrs({
  className: 'assessment-summary-assessment-metadata-label',
})`
  margin-bottom: 0.125rem;

  font-size: ${({ theme }) => theme.typography.body.small.size};

  color: ${({ theme }) => theme.colors.text.muted};
`;

export const AssessmentMetadataValue = styled.dd.attrs({
  className: 'assessment-summary-assessment-metadata-value',
})`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xxxs};

  margin: 0;

  font-size: ${({ theme }) => theme.typography.body.medium.size};

  font-weight: ${({ theme }) => theme.typography.fontWeights.medium};

  color: ${({ theme }) => theme.colors.text.primary};

  svg {
    width: 0.875rem;
    height: 0.875rem;

    color: ${({ theme }) => theme.colors.text.muted};
  }
`;

export default StyledAssessmentSummary;
