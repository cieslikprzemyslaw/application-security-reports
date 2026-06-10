import styled, { css } from 'styled-components';
const Shell = styled.main`
  ${({ theme: { colors, spacing } }) => css`
    min-height: 100vh;
    display: grid;
    place-items: center;
    padding: ${spacing.l};
    background: ${colors.surface.page};
  `}
`;
const Card = styled.section`
  ${({ theme: { colors, radii, shadows, spacing } }) => css`
    width: min(100%, 48rem);
    padding: ${spacing.xl};
    border: 1px solid ${colors.border.default};
    border-radius: ${radii.lg};
    background: ${colors.surface.card};
    box-shadow: ${shadows.md};
  `}
`;
const App = () => (
  <Shell>
    <Card>
      <p className="eyebrow">AppSec Report Builder</p>
      <h1>Project foundation is ready.</h1>
      <p className="text-large">
        Theme, local API, file storage and Storybook are configured. Next:
        reusable UI components.
      </p>
    </Card>
  </Shell>
);
export default App;
