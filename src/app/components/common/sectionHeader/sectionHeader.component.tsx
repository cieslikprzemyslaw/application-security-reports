import React from 'react';

import StyledSectionHeader from './sectionHeader.styled';
import type { SectionHeaderProps } from './sectionHeader.type';

const SectionHeader = ({
  title,
  subtitle,
  actions,
  ...rest
}: SectionHeaderProps) => (
  <StyledSectionHeader className="section-header" {...rest}>
    <div className="section-header-text">
      <h2 className="section-header-title">{title}</h2>

      {subtitle && <p className="section-header-subtitle">{subtitle}</p>}
    </div>

    {actions && <div className="section-header-actions">{actions}</div>}
  </StyledSectionHeader>
);

export default SectionHeader;
