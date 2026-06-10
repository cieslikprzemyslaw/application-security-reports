import styled from 'styled-components';

export const StyledAppShell = styled.div.attrs({ className: 'app-shell' })`
  min-height: 100vh;

  background-color: ${({ theme }) => theme.colors.surface.page};
`;

export const AppShellSidebar = styled.aside.attrs({
  className: 'app-shell-sidebar',
})<{
  $isOpen: boolean;
}>`
  position: fixed;
  inset: 0 auto 0 0;
  z-index: ${({ theme }) => theme.zIndices.drawer};

  width: ${({ theme }) => theme.layoutSizes.sidebarWidth};

  transform: translateX(${({ $isOpen }) => ($isOpen ? '0' : '-100%')});

  transition: transform ${({ theme }) => theme.transitions.base};

  @media ${({ theme }) => theme.mq.min.laptop} {
    transform: translateX(0);
  }
`;

export const AppShellOverlay = styled.button.attrs({
  className: 'app-shell-overlay',
})<{
  $isOpen: boolean;
}>`
  position: fixed;
  inset: 0;
  z-index: ${({ theme }) => theme.zIndices.overlay};

  display: ${({ $isOpen }) => ($isOpen ? 'block' : 'none')};

  padding: 0;
  border: 0;

  background-color: rgb(16 24 40 / 45%);

  @media ${({ theme }) => theme.mq.min.laptop} {
    display: none;
  }
`;

export const AppShellMain = styled.div.attrs({ className: 'app-shell-main' })`
  min-width: 0;
  min-height: 100vh;

  @media ${({ theme }) => theme.mq.min.laptop} {
    margin-left: ${({ theme }) => theme.layoutSizes.sidebarWidth};
  }
`;

export const AppShellTopbar = styled.div.attrs({
  className: 'app-shell-topbar',
})`
  position: sticky;
  top: 0;
  z-index: ${({ theme }) => theme.zIndices.sticky};
`;

export const AppShellContent = styled.main.attrs({
  className: 'app-shell-content',
})`
  min-width: 0;
`;
