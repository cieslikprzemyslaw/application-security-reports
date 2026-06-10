import styled from 'styled-components';

export const ThreatTitleCell = styled.div.attrs({
  className: 'threat-table-threat-title-cell',
})`
  min-width: 14rem;
`;

export const ThreatTitle = styled.strong.attrs({
  className: 'threat-table-threat-title',
})`
  display: block;

  color: ${({ theme }) => theme.colors.text.primary};
`;

export const ThreatEndpoint = styled.span.attrs({
  className: 'threat-table-threat-endpoint',
})`
  display: block;
  margin-top: 0.125rem;

  font-family: ${({ theme }) => theme.typography.fontFamilies.mono};

  font-size: ${({ theme }) => theme.typography.mono.small.size};

  color: ${({ theme }) => theme.colors.text.muted};
`;

export const StrideBadge = styled.span.attrs({
  className: 'threat-table-stride-badge',
})`
  display: inline-flex;
  align-items: center;

  padding: 0.125rem 0.5rem;

  border-radius: ${({ theme }) => theme.radii.pill};

  font-size: ${({ theme }) => theme.typography.body.small.size};

  color: ${({ theme }) => theme.colors.text.secondary};

  background-color: ${({ theme }) => theme.colors.neutral.grey100};
`;

export const ThreatDate = styled.time.attrs({
  className: 'threat-table-threat-date',
})`
  white-space: nowrap;

  color: ${({ theme }) => theme.colors.text.muted};
`;
