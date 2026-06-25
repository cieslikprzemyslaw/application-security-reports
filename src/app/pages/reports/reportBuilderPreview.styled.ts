import { css, styled } from 'styled-components';

const StyledReportBuilderPreview = styled.div`
  ${({ theme: { spacing } }) => css`
    display: grid;
    gap: ${spacing.m};

    .report-builder-preview-state {
      display: grid;
      min-height: 16rem;
      place-items: center;
      text-align: center;
    }

    .report-builder-preview-warnings ul {
      margin: 0;
      padding-left: 1.25rem;
    }

    .report-builder-preview-logo {
      display: block;
      max-width: 8rem;
      max-height: 4rem;
      object-fit: contain;
    }

    @media print {
      .report-builder-preview-warnings {
        display: none !important;
      }
    }
  `}
`;

export default StyledReportBuilderPreview;
