import React from 'react';

import StyledCard, { getPadding } from './card.styled';
import type { CardProps } from './card.type';

const Card = ({
  title,
  subtitle,
  actions,
  children,
  footer,
  padding = 'medium',
  as = 'section',
  ...rest
}: CardProps) => (
  <StyledCard
    as={as}
    className="card"
    style={{ '--card-padding': getPadding(padding) } as React.CSSProperties}
    {...rest}
  >
    {(title || subtitle || actions) && (
      <header className="card-header">
        <div className="card-title-group">
          {title && <h3 className="card-title">{title}</h3>}

          {subtitle && <p className="card-subtitle">{subtitle}</p>}
        </div>

        {actions && <div className="card-actions">{actions}</div>}
      </header>
    )}

    <div className="card-body">{children}</div>

    {footer && <footer className="card-footer">{footer}</footer>}
  </StyledCard>
);

export default Card;
