import styled from 'styled-components';

const StyledReportActions = styled.div.attrs({ className: 'report-actions' })`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xxs};
`;

export default StyledReportActions;
