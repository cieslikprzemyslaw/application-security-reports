import styled from 'styled-components';

const StyledSettings = styled.div.attrs({ className: 'settings' })`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.l};
`;

export const Header = styled.header.attrs({ className: 'settings-header' })``;

export const Title = styled.h1.attrs({ className: 'settings-title' })`
  font-size: ${({ theme }) => theme.typography.headings.h3.size};
`;

export const Subtitle = styled.p.attrs({ className: 'settings-subtitle' })`
  margin-top: ${({ theme }) => theme.spacing.xxxs};

  color: ${({ theme }) => theme.colors.text.muted};
`;

export const Form = styled.form.attrs({ className: 'settings-form' })`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.m};
`;

export const Grid = styled.div.attrs({ className: 'settings-grid' })`
  display: grid;
  grid-template-columns: 1fr;
  gap: ${({ theme }) => theme.spacing.s};

  @media ${({ theme }) => theme.mq.min.laptop} {
    grid-template-columns:
      minmax(0, 1.2fr)
      minmax(18rem, 0.8fr);
  }
`;

export const Stack = styled.div.attrs({ className: 'settings-stack' })`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.s};
`;

export const TwoColumn = styled.div.attrs({ className: 'settings-two-column' })`
  display: grid;
  grid-template-columns: 1fr;
  gap: ${({ theme }) => theme.spacing.s};

  @media ${({ theme }) => theme.mq.min.tablet} {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
`;

export const AvatarRow = styled.div.attrs({ className: 'settings-avatar-row' })`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.s};

  margin-bottom: ${({ theme }) => theme.spacing.s};
`;

export const Avatar = styled.div.attrs({ className: 'settings-avatar' })`
  display: inline-flex;
  align-items: center;
  justify-content: center;

  width: 3.25rem;
  height: 3.25rem;

  border-radius: ${({ theme }) => theme.radii.circle};

  color: ${({ theme }) => theme.colors.neutral.white};

  background-color: ${({ theme }) => theme.colors.brand.primary};
`;

export const UploadBox = styled.div.attrs({ className: 'settings-upload-box' })`
  display: flex;
  align-items: center;
  justify-content: center;

  min-height: 4rem;

  border: 1px dashed ${({ theme }) => theme.colors.border.default};

  border-radius: ${({ theme }) => theme.radii.md};

  color: ${({ theme }) => theme.colors.text.link};

  background-color: ${({ theme }) => theme.colors.neutral.grey50};
`;

export const ToggleRow = styled.label.attrs({
  className: 'settings-toggle-row',
})`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.s};

  padding: 0.5rem 0;
`;

export const Toggle = styled.input.attrs({ className: 'settings-toggle' })`
  width: 2.25rem;
  height: 1.25rem;

  accent-color: ${({ theme }) => theme.colors.brand.primary};
`;

export const SeverityList = styled.div.attrs({
  className: 'settings-severity-list',
})`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xxs};
`;

export const SeverityRow = styled.div.attrs({
  className: 'settings-severity-row',
})`
  display: flex;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing.s};
`;

export const Actions = styled.div.attrs({ className: 'settings-actions' })`
  display: flex;
  justify-content: flex-end;
`;

export default StyledSettings;
