import React from 'react';

import StyledPageContent from './pageContent.styled';

import type { PageContentProps } from './pageContent.type';

const PageContent = ({
  children,
  maxWidth = 'wide',
  spacing = 'default',
  ...rest
}: PageContentProps) => (
  <StyledPageContent $maxWidth={maxWidth} $spacing={spacing} {...rest}>
    {children}
  </StyledPageContent>
);

export default PageContent;
