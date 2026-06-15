import { css, styled } from 'styled-components';

const StyledAssessmentForm = styled.form`
  ${({ theme: { colors, spacing, typography } }) => css`
    display: flex;
    flex-direction: column;
    gap: ${spacing.m};

    .assessment-form-alert {
      margin: 0;
    }

    .assessment-form-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: ${spacing.m};
    }

    .assessment-form-full-width {
      grid-column: 1 / -1;
    }

    .assessment-form-status-section {
      display: flex;
      flex-direction: column;
      gap: ${spacing.xxs};
      padding: ${spacing.m};
      border: 1px solid ${colors.border.subtle};
      border-radius: 0.875rem;
      background-color: ${colors.neutral.grey50};
    }

    .assessment-form-status-header {
      display: flex;
      flex-wrap: wrap;
      align-items: flex-start;
      justify-content: space-between;
      gap: ${spacing.xxs};
    }

    .assessment-form-status-header h3 {
      font-size: ${typography.body.medium.size};
      line-height: ${typography.body.medium.lineHeight};
    }

    .assessment-form-status-help,
    .assessment-form-status-note {
      color: ${colors.text.muted};
    }

    .assessment-form-status-actions {
      display: flex;
      flex-wrap: wrap;
      gap: ${spacing.xxs};
    }

    .assessment-form-actions {
      display: flex;
      flex-wrap: wrap;
      justify-content: flex-end;
      gap: ${spacing.xxs};
      padding-top: ${spacing.xxs};
    }

    @media (min-width: 48rem) {
      .assessment-form-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
    }
  `}
`;

export default StyledAssessmentForm;
