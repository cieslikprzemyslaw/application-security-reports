import { styled, css } from 'styled-components';

const StyledThreatDrawer = styled.div.attrs({ className: 'threat-drawer' })`
  ${({ theme: { colors, spacing, typography } }) => css`
    display: flex;
    flex-direction: column;
    gap: ${spacing.m};

    .threat-drawer-meta {
      display: flex;
      flex-wrap: wrap;
      gap: ${spacing.xxs};
    }

    .threat-drawer-body {
      display: flex;
      flex-direction: column;
      gap: ${spacing.m};
    }

    .threat-drawer-section {
      padding-top: ${spacing.s};
      border-top: 1px solid ${colors.border.subtle};
    }

    .threat-drawer-section-title {
      margin-bottom: ${spacing.xxs};
      font-size: ${typography.headings.h6.size};
    }

    .threat-drawer-copy {
      color: ${colors.text.secondary};
      overflow-wrap: anywhere;
    }

    .threat-drawer-actions {
      display: flex;
      justify-content: flex-end;
    }
  `}
`;

export default StyledThreatDrawer;
