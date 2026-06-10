import styled, { css } from 'styled-components';

const StyledCompanies = styled.div.attrs({ className: 'companies' })`
  ${({ theme: { colors, radii, shadows, spacing } }) => css`
    display: flex;
    flex-direction: column;
    gap: ${spacing.l};

    .companies-card {
      overflow: hidden;

      border: 1px solid ${colors.border.subtle};
      border-radius: ${radii.lg};
      background-color: ${colors.surface.card};
      box-shadow: ${shadows.xs};
    }
  `}
`;

export default StyledCompanies;
