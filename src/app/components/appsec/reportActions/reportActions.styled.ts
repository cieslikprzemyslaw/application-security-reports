import { css, styled } from 'styled-components';

const StyledReportActions = styled.div`
  ${({ theme: { spacing } }) => css`
    container-type: inline-size;

    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: ${spacing.xxs};

    width: 100%;
    min-width: 0;

    .report-actions__action {
      min-width: 0;
      max-width: 100%;
    }

    .report-actions__disabled-reason {
      position: absolute;

      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;

      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      clip-path: inset(50%);
      white-space: nowrap;

      border: 0;
    }

    @container (max-width: 36rem) {
      .report-actions__action {
        flex: 1 1 100%;

        width: 100%;
        white-space: normal;
      }

      .report-actions__action .button-label {
        justify-content: center;
        overflow-wrap: anywhere;
        white-space: normal;
      }
    }

    @media print {
      display: none !important;
    }
  `}
`;

export default StyledReportActions;
