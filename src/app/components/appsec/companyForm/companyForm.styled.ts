import { css, styled } from 'styled-components';

const StyledCompanyForm = styled.form`
  ${({ theme: { colors, radii, spacing, typography } }) => css`
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

    .company-logo-preview {
      display: flex;
      flex-direction: column;
      gap: ${spacing.xxxs};
    }

    .company-logo-preview-label {
      font-size: ${typography.label.medium.size};
      line-height: ${typography.label.medium.lineHeight};
      font-weight: ${typography.label.medium.weight};
      color: ${colors.text.primary};
    }

    .company-logo-preview-img {
      width: 3rem;
      height: 3rem;
      border-radius: ${radii.md};
      border: 1px solid ${colors.border.default};
    }

    .company-logo-preview-actions {
      display: flex;
      gap: ${spacing.xxs};
      align-items: center;
    }

    .company-logo-replace-input {
      position: absolute;
      width: 1px;
      height: 1px;
      opacity: 0;
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
