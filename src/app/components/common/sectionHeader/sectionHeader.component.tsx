import React from 'react';

import {
  SectionHeaderActions,
  SectionHeaderSubtitle,
  SectionHeaderText,
  SectionHeaderTitle,
  StyledSectionHeader,
} from './sectionHeader.styled';
import type { SectionHeaderProps } from './sectionHeader.type';

const SectionHeader = ({
  title,
  subtitle,
  actions,
  ...rest
}: SectionHeaderProps) => (
  <StyledSectionHeader {...rest}>
    <SectionHeaderText>
      <SectionHeaderTitle>{title}</SectionHeaderTitle>

      {subtitle && <SectionHeaderSubtitle>{subtitle}</SectionHeaderSubtitle>}
    </SectionHeaderText>

    {actions && <SectionHeaderActions>{actions}</SectionHeaderActions>}
  </StyledSectionHeader>
);

export default SectionHeader;
