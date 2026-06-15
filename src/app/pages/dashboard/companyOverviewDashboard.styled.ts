import { styled, css } from 'styled-components';

const StyledDashboard = styled.div.attrs({ className: 'dashboard' })`
  ${({ theme: { mq, spacing } }) => css`
    display: flex;
    flex-direction: column;
    gap: ${spacing.l};

    .dashboard-stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr));
      gap: ${spacing.s};
    }

    .dashboard-top-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: ${spacing.s};

      @media ${mq.min.laptop} {
        grid-template-columns: minmax(16rem, 0.7fr) minmax(0, 1.3fr);
        align-items: start;
      }
    }

    .dashboard-quick-actions {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(10rem, 1fr));
      gap: ${spacing.xs};
    }

    .dashboard-empty-section {
      padding: ${spacing.l};
    }

    .dashboard-empty-section .empty-state {
      min-height: 12rem;
    }
  `}
`;

export default StyledDashboard;
