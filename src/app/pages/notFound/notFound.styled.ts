import { styled, css } from 'styled-components';

const StyledNotFound = styled.section`
  ${({ theme: { colors, radii, shadows, spacing } }) => css`
    display: grid;
    gap: ${spacing.m};
    justify-items: start;
    padding: ${spacing.xl};
    border: 1px solid ${colors.border.default};
    border-radius: ${radii.lg};
    background: ${colors.surface.card};
    box-shadow: ${shadows.sm};

    .not-found-eyebrow {
      margin: 0;
      color: ${colors.text.muted};
      font-size: 0.8125rem;
      letter-spacing: 0.12em;
      text-transform: uppercase;
    }

    .not-found-title,
    .not-found-message {
      margin: 0;
    }

    .not-found-message {
      color: ${colors.text.muted};
      max-width: 40rem;
    }

    .not-found-link {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-height: 2.75rem;
      padding: 0 ${spacing.l};
      border-radius: ${radii.md};
      color: ${colors.text.inverse};
      background: ${colors.brand.primary};
      text-decoration: none;
      font-weight: 600;
    }
  `}
`;

export default StyledNotFound;
