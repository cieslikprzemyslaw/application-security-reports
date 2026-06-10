import styled from 'styled-components';
const Shell = styled.main`
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: ${({ theme }) => theme.spacing.l};
  background: ${({ theme }) => theme.colors.surface.page};
`;
const Card = styled.section`
  width: min(100%, 48rem);
  padding: ${({ theme }) => theme.spacing.xl};
  border: 1px solid ${({ theme }) => theme.colors.border.default};
  border-radius: ${({ theme }) => theme.radii.lg};
  background: ${({ theme }) => theme.colors.surface.card};
  box-shadow: ${({ theme }) => theme.shadows.md};
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
