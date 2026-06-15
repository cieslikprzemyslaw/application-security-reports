import { css, styled } from 'styled-components';

const StyledCompanyForm = styled.form`
  ${({ theme: { colors, spacing, typography } }) => css`
    display: flex;
    flex-direction: column;
    gap: ${spacing.m};

    .company-form-alert {
      margin: 0;
    }

    .company-form-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: ${spacing.m};
    }

    .company-form-actions {
      display: flex;
      flex-wrap: wrap;
      justify-content: flex-end;
      gap: ${spacing.xxs};
      padding-top: ${spacing.xxs};
    }

    .company-form-hint {
      font-size: ${typography.body.small.size};
      line-height: ${typography.body.small.lineHeight};
      color: ${colors.text.muted};
    }

    @media (min-width: 48rem) {
      .company-form-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }

      .company-form-full-width {
        grid-column: 1 / -1;
      }
    }
  `}
`;

export default StyledCompanyForm;
