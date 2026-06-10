import styled from 'styled-components';

export const StyledPageHeader = styled.header.attrs({
  className: 'page-header',
})`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.s};

  @media ${({ theme }) => theme.mq.min.tablet} {
    flex-direction: row;
    align-items: flex-start;
    justify-content: space-between;
  }
`;

export const PageHeaderContent = styled.div.attrs({
  className: 'page-header-content',
})`
  min-width: 0;
`;

export const PageHeaderEyebrow = styled.p.attrs({
  className: 'page-header-eyebrow',
})`
  margin: 0 0 ${({ theme }) => theme.spacing.xxxs};

  font-size: ${({ theme }) => theme.typography.label.small.size};

  line-height: ${({ theme }) => theme.typography.label.small.lineHeight};

  font-weight: ${({ theme }) => theme.typography.label.small.weight};

  color: ${({ theme }) => theme.colors.brand.primary};

  text-transform: uppercase;
  letter-spacing: 0.08em;
`;

export const PageHeaderTitle = styled.h1.attrs({
  className: 'page-header-title',
})`
  margin: 0;
`;

export const PageHeaderSubtitle = styled.p.attrs({
  className: 'page-header-subtitle',
})`
  max-width: 48rem;
  margin-top: ${({ theme }) => theme.spacing.xxxs};

  color: ${({ theme }) => theme.colors.text.muted};
`;

export const PageHeaderActions = styled.div.attrs({
  className: 'page-header-actions',
})`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.xxs};

  @media ${({ theme }) => theme.mq.min.tablet} {
    justify-content: flex-end;
  }
`;

export const BreadcrumbList = styled.ol.attrs({
  className: 'page-header-breadcrumb-list',
})`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xxxs};

  margin: 0 0 ${({ theme }) => theme.spacing.xxs};
  padding: 0;

  list-style: none;
`;

export const BreadcrumbItem = styled.li.attrs({
  className: 'page-header-breadcrumb-item',
})`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xxxs};

  font-size: ${({ theme }) => theme.typography.body.small.size};

  line-height: ${({ theme }) => theme.typography.body.small.lineHeight};

  color: ${({ theme }) => theme.colors.text.muted};

  &:not(:last-child)::after {
    content: '/';
    color: ${({ theme }) => theme.colors.neutral.grey400};
  }

  button {
    padding: 0;
    border: 0;

    color: ${({ theme }) => theme.colors.text.link};
    background: transparent;
  }
`;
