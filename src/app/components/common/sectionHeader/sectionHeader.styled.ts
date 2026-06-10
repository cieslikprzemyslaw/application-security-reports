import styled from 'styled-components';

export const StyledSectionHeader = styled.header.attrs({
  className: 'section-header',
})`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xxs};

  @media ${({ theme }) => theme.mq.min.tablet} {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }
`;

export const SectionHeaderText = styled.div.attrs({
  className: 'section-header-text',
})`
  min-width: 0;
`;

export const SectionHeaderTitle = styled.h2.attrs({
  className: 'section-header-title',
})`
  font-size: ${({ theme }) => theme.typography.headings.h4.size};

  line-height: ${({ theme }) => theme.typography.headings.h4.lineHeight};
`;

export const SectionHeaderSubtitle = styled.p.attrs({
  className: 'section-header-subtitle',
})`
  margin-top: ${({ theme }) => theme.spacing.xxxs};

  color: ${({ theme }) => theme.colors.text.muted};
`;

export const SectionHeaderActions = styled.div.attrs({
  className: 'section-header-actions',
})`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.xxs};
`;
