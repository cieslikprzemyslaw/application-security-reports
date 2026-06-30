import { css, styled } from 'styled-components';

import type { CompanyAvatarStyledProps } from './companyAvatar.type';

const avatarSizeMap = {
  small: '1.25rem',
  medium: '2rem',
  large: '2.25rem',
} as const;

const StyledCompanyAvatar = styled.span<CompanyAvatarStyledProps>`
  ${({ $size, $tone, theme: { colors, radii, typography } }) => css`
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;

    width: ${avatarSizeMap[$size]};
    height: ${avatarSizeMap[$size]};

    overflow: hidden;
    border-radius: ${radii.md};

    color: ${colors.neutral.white};
    background-color: ${$tone === 'blue'
      ? colors.brand.primary
      : $tone === 'cyan'
        ? colors.severity.informational.solid
        : $tone === 'orange'
          ? colors.severity.high.solid
          : $tone === 'green'
            ? colors.severity.low.solid
            : $tone === 'purple'
              ? colors.status.retestRequired.text
              : colors.neutral.grey600};

    font-size: ${$size === 'small'
      ? typography.label.small.size
      : typography.body.small.size};
    line-height: 1;
    font-weight: ${typography.fontWeights.medium};
    text-transform: uppercase;

    .company-avatar__image {
      display: block;
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .company-avatar__initials {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 100%;
    }
  `}
`;

export default StyledCompanyAvatar;
