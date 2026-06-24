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

    .report-builder-preview-logo {
      display: block;
      max-width: 8rem;
      max-height: 4rem;
      object-fit: contain;
    }
  `}
`;

export default StyledReportBuilderPreview;
