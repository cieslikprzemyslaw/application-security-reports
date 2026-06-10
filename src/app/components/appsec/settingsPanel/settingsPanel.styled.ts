import styled, { css } from 'styled-components';

const StyledSettingsPanel = styled.section.attrs({
  className: 'settings-panel',
})`
  ${({ theme: { colors, radii, shadows, spacing, typography } }) => css`
    overflow: hidden;

    border: 1px solid ${colors.border.subtle};
    border-radius: ${radii.lg};
    background-color: ${colors.surface.card};
    box-shadow: ${shadows.xs};

    .settings-panel-header {
      display: flex;
      align-items: baseline;
      gap: ${spacing.xxs};

      padding: ${spacing.s} ${spacing.m};

      border-bottom: 1px solid ${colors.border.subtle};
    }

    .settings-panel-title {
      font-size: ${typography.headings.h6.size};
    }

    .settings-panel-subtitle {
      font-size: ${typography.body.small.size};
      color: ${colors.text.muted};
    }

    .settings-panel-body {
      padding: ${spacing.m};
    }
  `}
`;

export default StyledSettingsPanel;
