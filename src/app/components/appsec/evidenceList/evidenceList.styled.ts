import styled from 'styled-components';

export const StyledEvidenceList = styled.ul.attrs({
  className: 'evidence-list',
})`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(16rem, 1fr));
  gap: ${({ theme }) => theme.spacing.s};

  margin: 0;
  padding: 0;

  list-style: none;
`;

export const EvidenceListItem = styled.li.attrs({
  className: 'evidence-list-item',
})`
  overflow: hidden;

  border: 1px solid ${({ theme }) => theme.colors.border.subtle};

  border-radius: ${({ theme }) => theme.radii.lg};

  background-color: ${({ theme }) => theme.colors.surface.card};

  box-shadow: ${({ theme }) => theme.shadows.xs};
`;

export const EvidencePreview = styled.button.attrs({
  className: 'evidence-list-evidence-preview',
})`
  display: flex;
  align-items: center;
  justify-content: center;

  width: 100%;
  min-height: 8rem;
  padding: 0;

  border: 0;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border.subtle};

  color: ${({ theme }) => theme.colors.brand.primary};

  background-color: ${({ theme }) => theme.colors.neutral.grey50};

  overflow: hidden;

  img {
    width: 100%;
    height: 8rem;

    object-fit: cover;
  }

  svg {
    width: 2rem;
    height: 2rem;
  }

  &:disabled {
    cursor: default;
  }
`;

export const EvidenceContent = styled.div.attrs({
  className: 'evidence-list-evidence-content',
})`
  padding: ${({ theme }) => theme.spacing.s};
`;

export const EvidenceHeader = styled.div.attrs({
  className: 'evidence-list-evidence-header',
})`
  display: grid;
  grid-template-columns:
    minmax(0, 1fr)
    auto;
  gap: ${({ theme }) => theme.spacing.xxs};
`;

export const EvidenceDetails = styled.div.attrs({
  className: 'evidence-list-evidence-details',
})`
  min-width: 0;
`;

export const EvidenceName = styled.button.attrs({
  className: 'evidence-list-evidence-name',
})`
  display: block;
  max-width: 100%;
  padding: 0;

  border: 0;

  font-size: ${({ theme }) => theme.typography.body.medium.size};

  font-weight: ${({ theme }) => theme.typography.fontWeights.semibold};

  color: ${({ theme }) => theme.colors.text.primary};

  background: transparent;

  overflow: hidden;
  text-align: left;
  text-overflow: ellipsis;
  white-space: nowrap;

  &:hover:not(:disabled) {
    color: ${({ theme }) => theme.colors.text.link};
  }

  &:disabled {
    cursor: default;
  }
`;

export const EvidenceMetadata = styled.p.attrs({
  className: 'evidence-list-evidence-metadata',
})`
  margin-top: 0.125rem;

  font-size: ${({ theme }) => theme.typography.body.small.size};

  color: ${({ theme }) => theme.colors.text.muted};
`;

export const EvidenceDescription = styled.p.attrs({
  className: 'evidence-list-evidence-description',
})`
  margin-top: ${({ theme }) => theme.spacing.xxs};

  color: ${({ theme }) => theme.colors.text.secondary};
`;

export const EvidenceRemoveButton = styled.button.attrs({
  className: 'evidence-list-evidence-remove-button',
})`
  align-self: start;

  padding: 0.375rem;

  border: 0;
  border-radius: ${({ theme }) => theme.radii.md};

  color: ${({ theme }) => theme.colors.feedback.error};

  background: transparent;

  &:hover {
    background-color: ${({ theme }) =>
      theme.colors.severity.critical.background};
  }
`;

export const EvidenceEmpty = styled.li.attrs({
  className: 'evidence-list-evidence-empty',
})`
  grid-column: 1 / -1;

  padding: ${({ theme }) => theme.spacing.l};

  border: 1px dashed ${({ theme }) => theme.colors.border.default};

  border-radius: ${({ theme }) => theme.radii.lg};

  color: ${({ theme }) => theme.colors.text.muted};

  text-align: center;
`;
