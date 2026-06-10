import { styled, css } from 'styled-components';

const StyledSettings = styled.div.attrs({ className: 'settings' })`
  ${({ theme: { colors, radii, spacing, mq, typography } }) => css`
    display: flex;
    flex-direction: column;
    gap: ${spacing.l};

    .settings-header {
      margin: 0;
    }

    .settings-title {
      font-size: ${typography.headings.h3.size};
    }

    .settings-subtitle {
      margin-top: ${spacing.xxxs};
      color: ${colors.text.muted};
    }

    .settings-form {
      display: flex;
      flex-direction: column;
      gap: ${spacing.m};
    }

    .settings-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: ${spacing.s};

      @media ${mq.min.laptop} {
        grid-template-columns: minmax(0, 1.2fr) minmax(18rem, 0.8fr);
      }
    }

    .settings-stack {
      display: flex;
      flex-direction: column;
      gap: ${spacing.s};
    }

    .settings-two-column {
      display: grid;
      grid-template-columns: 1fr;
      gap: ${spacing.s};

      @media ${mq.min.tablet} {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
    }

    .settings-avatar-row {
      display: flex;
      align-items: center;
      gap: ${spacing.s};
      margin-bottom: ${spacing.s};
    }

    .settings-avatar {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 3.25rem;
      height: 3.25rem;
      border-radius: ${radii.circle};
      color: ${colors.neutral.white};
      background-color: ${colors.brand.primary};
    }

    .settings-upload-box {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 4rem;
      border: 1px dashed ${colors.border.default};
      border-radius: ${radii.md};
      color: ${colors.text.link};
      background-color: ${colors.neutral.grey50};
    }

    .settings-toggle-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: ${spacing.s};
      padding: 0.5rem 0;
    }

    .settings-toggle {
      width: 2.25rem;
      height: 1.25rem;
      accent-color: ${colors.brand.primary};
    }

    .settings-severity-list {
      display: flex;
      flex-direction: column;
      gap: ${spacing.xxs};
    }

    .settings-severity-row {
      display: flex;
      justify-content: space-between;
      gap: ${spacing.s};
    }

    .settings-actions {
      display: flex;
      justify-content: flex-end;
    }
  `}
`;

export default StyledSettings;
