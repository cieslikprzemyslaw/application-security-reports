import { styled, css } from 'styled-components';

const StyledReportActions = styled.div.attrs({ className: 'report-actions' })`
  ${({ theme: { spacing } }) => css`
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: ${spacing.xxs};
  `}
`;

export default StyledReportActions;
