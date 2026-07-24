import React from 'react';

import {
  StyledCollectionRowButton,
  StyledCollectionRowLink,
} from './collectionRowAction.styled';
import type { CollectionRowActionProps } from './collectionRowAction.type';

const getClassName = (
  className: string | undefined,
  isSelected: boolean,
  disabled: boolean,
) =>
  [
    'collection-row-action',
    isSelected ? 'collection-row-action--selected' : '',
    disabled ? 'collection-row-action--disabled' : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

const CollectionRowAction = (props: CollectionRowActionProps) => {
  if (props.to !== undefined) {
    const {
      to,
      label,
      children,
      className,
      disabled = false,
      isSelected = false,
      replace,
      ...dataAttributes
    } = props;

    return (
      <StyledCollectionRowLink
        {...dataAttributes}
        className={getClassName(className, isSelected, disabled)}
        to={to}
        replace={replace}
        aria-label={label}
        aria-current={isSelected ? 'page' : undefined}
        aria-disabled={disabled || undefined}
        tabIndex={disabled ? -1 : undefined}
        onClick={event => {
          if (disabled) {
            event.preventDefault();
          }
        }}
      >
        <span className="collection-row-action__label">
          {children ?? label}
        </span>
      </StyledCollectionRowLink>
    );
  }

  const {
    label,
    children,
    className,
    disabled = false,
    isSelected = false,
    onActivate,
    ...dataAttributes
  } = props;

  return (
    <StyledCollectionRowButton
      {...dataAttributes}
      type="button"
      className={getClassName(className, isSelected, disabled)}
      aria-label={label}
      aria-pressed={isSelected || undefined}
      disabled={disabled}
      onClick={onActivate}
    >
      <span className="collection-row-action__label">{children ?? label}</span>
    </StyledCollectionRowButton>
  );
};

export default CollectionRowAction;
