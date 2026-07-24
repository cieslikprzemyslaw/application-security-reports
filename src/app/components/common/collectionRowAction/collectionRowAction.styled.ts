import { Link } from 'react-router-dom';
import { css, styled } from 'styled-components';

const collectionRowActionStyles = css`
  ${({ theme: { colors } }) => css`
    position: absolute;
    inset: 0;
    z-index: 1;

    display: block;
    width: 100%;
    min-height: 100%;
    padding: 0;

    border: 0;
    border-radius: inherit;
    background: transparent;

    color: inherit;
    font: inherit;
    text-decoration: none;
    cursor: pointer;

    &:focus-visible {
      outline: 2px solid ${colors.border.focus};
      outline-offset: -3px;
    }

    &:disabled,
    &[aria-disabled='true'] {
      cursor: not-allowed;
    }

    .collection-row-action__label {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    }
  `}
`;

export const StyledCollectionRowLink = styled(Link)`
  ${collectionRowActionStyles}
`;

export const StyledCollectionRowButton = styled.button`
  ${collectionRowActionStyles}
`;
