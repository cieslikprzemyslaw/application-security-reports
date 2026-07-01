import React, { useState } from 'react';

import StyledCompanyAvatar from './companyAvatar.styled';

import type { CompanyAvatarProps } from './companyAvatar.type';

const getCompanyInitials = (name: string) => {
  const trimmed = name.trim();

  if (trimmed.length === 0) {
    return '??';
  }

  const words = trimmed.split(/\s+/).filter(Boolean);
  const initials =
    words.length > 1
      ? words
          .slice(0, 2)
          .map(word => word[0])
          .join('')
      : trimmed.slice(0, 2);

  return initials.toUpperCase();
};

const getSafeLogoUrl = (value?: string | null) => {
  const trimmed = value?.trim();

  if (!trimmed) {
    return undefined;
  }

  if (
    trimmed.toLowerCase().startsWith('file:') ||
    /^[a-z]:[\\/]/i.test(trimmed) ||
    trimmed.startsWith('\\\\') ||
    trimmed.includes('\\')
  ) {
    return undefined;
  }

  return trimmed;
};

const CompanyAvatar = ({
  companyName,
  logoUrl,
  initials,
  tone = 'blue',
  size = 'medium',
  className,
  isDecorative = false,
  ariaLabel,
}: CompanyAvatarProps) => {
  const safeLogoUrl = getSafeLogoUrl(logoUrl);
  const [failedLogoUrl, setFailedLogoUrl] = useState<string>();
  const shouldRenderLogo = Boolean(
    safeLogoUrl && failedLogoUrl !== safeLogoUrl,
  );
  const fallbackInitials = initials?.trim() || getCompanyInitials(companyName);
  const accessibleLabel = ariaLabel ?? `${companyName} logo`;

  return (
    <StyledCompanyAvatar
      className={['company-avatar', className].filter(Boolean).join(' ')}
      $tone={tone}
      $size={size}
    >
      {shouldRenderLogo && safeLogoUrl ? (
        <img
          className="company-avatar__image"
          src={safeLogoUrl}
          alt={isDecorative ? '' : accessibleLabel}
          onError={() => setFailedLogoUrl(safeLogoUrl)}
        />
      ) : (
        <span
          className="company-avatar__initials"
          aria-hidden={isDecorative ? true : undefined}
          role={isDecorative ? undefined : 'img'}
          aria-label={isDecorative ? undefined : accessibleLabel}
        >
          {fallbackInitials}
        </span>
      )}
    </StyledCompanyAvatar>
  );
};

export default CompanyAvatar;
