import styled from 'styled-components';

const StyledReportPreviewShell = styled.div.attrs({
  className: 'report-preview-shell',
})`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.l};

  width: 100%;
`;

export const Header = styled.header.attrs({
  className: 'report-preview-shell-header',
})`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.s};

  @media ${({ theme }) => theme.mq.min.tablet} {
    flex-direction: row;
    align-items: flex-end;
    justify-content: space-between;
  }
`;

export const Title = styled.h1.attrs({
  className: 'report-preview-shell-title',
})`
  font-size: ${({ theme }) => theme.typography.headings.h3.size};
`;

export const Subtitle = styled.p.attrs({
  className: 'report-preview-shell-subtitle',
})`
  margin-top: ${({ theme }) => theme.spacing.xxxs};

  color: ${({ theme }) => theme.colors.text.secondary};
`;

export const Toolbar = styled.div.attrs({
  className: 'report-preview-shell-toolbar',
})`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.s};

  @media ${({ theme }) => theme.mq.min.tablet} {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }
`;

export const Tabs = styled.div.attrs({
  className: 'report-preview-shell-tabs',
})`
  display: inline-flex;
  gap: ${({ theme }) => theme.spacing.xxxs};

  padding: 0.25rem;

  border-radius: ${({ theme }) => theme.radii.md};

  background-color: ${({ theme }) => theme.colors.neutral.grey100};
`;

export const TabButton = styled.button.attrs({
  className: 'report-preview-shell-tab-button',
})<{
  $active: boolean;
}>`
  padding: 0.5rem 0.75rem;

  border: 0;
  border-radius: ${({ theme }) => theme.radii.sm};

  font-weight: ${({ theme }) => theme.typography.fontWeights.medium};

  color: ${({ theme, $active }) =>
    $active ? theme.colors.text.primary : theme.colors.text.secondary};

  background-color: ${({ theme, $active }) =>
    $active ? theme.colors.surface.card : 'transparent'};

  box-shadow: ${({ theme, $active }) => ($active ? theme.shadows.xs : 'none')};
`;

export const Actions = styled.div.attrs({
  className: 'report-preview-shell-actions',
})`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xxs};
`;

export const AutoSaved = styled.span.attrs({
  className: 'report-preview-shell-auto-saved',
})`
  color: ${({ theme }) => theme.colors.feedback.success};

  font-size: ${({ theme }) => theme.typography.body.small.size};
`;

export const Stage = styled.div.attrs({
  className: 'report-preview-shell-stage',
})`
  min-height: 60rem;
  padding: ${({ theme }) => theme.spacing.xl};

  border: 1px solid ${({ theme }) => theme.colors.border.subtle};

  border-radius: ${({ theme }) => theme.radii.lg};

  background-color: ${({ theme }) => theme.colors.neutral.grey100};
`;

export const Paper = styled.div.attrs({
  className: 'report-preview-shell-paper',
})`
  width: min(100%, 72rem);
  margin: 0 auto;
  padding: ${({ theme }) => theme.spacing.xxl};

  border-top: 0.375rem solid ${({ theme }) => theme.colors.brand.primary};

  border-radius: ${({ theme }) => theme.radii.md};

  background-color: ${({ theme }) => theme.colors.neutral.white};

  box-shadow: ${({ theme }) => theme.shadows.md};

  @media print {
    width: 100%;
    max-width: none;
    padding: 0;

    border-top: 0;
    box-shadow: none;
  }
`;

export default StyledReportPreviewShell;
