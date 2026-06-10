import styled from 'styled-components';

const StyledThreatForm = styled.form.attrs({ className: 'threat-form' })`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.m};
`;

export const ThreatFormGrid = styled.div.attrs({
  className: 'threat-form-grid',
})`
  display: grid;
  grid-template-columns: 1fr;
  gap: ${({ theme }) => theme.spacing.s};

  @media ${({ theme }) => theme.mq.min.tablet} {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
`;

export const ThreatFormFullWidth = styled.div.attrs({
  className: 'threat-form-full-width',
})`
  grid-column: 1 / -1;
`;

export const ThreatFormActions = styled.div.attrs({
  className: 'threat-form-actions',
})`
  display: flex;
  justify-content: flex-end;
  gap: ${({ theme }) => theme.spacing.xxs};

  padding-top: ${({ theme }) => theme.spacing.s};

  border-top: 1px solid ${({ theme }) => theme.colors.border.subtle};
`;

export default StyledThreatForm;
