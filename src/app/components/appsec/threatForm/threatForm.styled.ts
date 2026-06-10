import { styled, css } from 'styled-components';

const StyledThreatForm = styled.form.attrs({ className: 'threat-form' })`
  ${({ theme: { colors, mq, spacing } }) => css`
    display: flex;
    flex-direction: column;
    gap: ${spacing.m};

    .threat-form-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: ${spacing.s};

      @media ${mq.min.tablet} {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
    }

    .threat-form-full-width {
      grid-column: 1 / -1;
    }

    .threat-form-actions {
      display: flex;
      justify-content: flex-end;
      gap: ${spacing.xxs};

      padding-top: ${spacing.s};
      border-top: 1px solid ${colors.border.subtle};
    }
  `}
`;

export default StyledThreatForm;
