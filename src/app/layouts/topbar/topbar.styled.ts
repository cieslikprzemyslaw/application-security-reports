import styled from 'styled-components';

const StyledTopbar = styled.header.attrs({ className: 'topbar' })`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.s};

  min-height: ${({ theme }) => theme.layoutSizes.topbarHeight};

  padding: 0 ${({ theme }) => theme.spacing.s};

  border-bottom: 1px solid ${({ theme }) => theme.colors.border.subtle};

  background-color: ${({ theme }) => theme.colors.surface.card};

  @media ${({ theme }) => theme.mq.min.tablet} {
    padding: 0 ${({ theme }) => theme.spacing.m};
  }
`;

export const TopbarMenu = styled.div.attrs({ className: 'topbar-menu' })`
  display: inline-flex;

  @media ${({ theme }) => theme.mq.min.laptop} {
    display: none;
  }
`;

export const TopbarTitle = styled.strong.attrs({ className: 'topbar-title' })`
  display: none;

  color: ${({ theme }) => theme.colors.text.primary};

  @media ${({ theme }) => theme.mq.min.tablet} {
    display: block;
  }
`;

export const TopbarSearch = styled.div.attrs({ className: 'topbar-search' })`
  flex: 1;
  min-width: 0;
  max-width: 30rem;
`;

export const TopbarSpacer = styled.div.attrs({ className: 'topbar-spacer' })`
  flex: 1;
`;

export const TopbarActions = styled.div.attrs({ className: 'topbar-actions' })`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xxs};
`;

export const TopbarUserMenu = styled.div.attrs({
  className: 'topbar-user-menu',
})`
  display: flex;
  align-items: center;

  margin-left: ${({ theme }) => theme.spacing.xxxs};
`;

export default StyledTopbar;
