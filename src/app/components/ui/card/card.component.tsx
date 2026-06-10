import React from 'react';

import {
  CardActions,
  CardBody,
  CardFooter,
  CardHeader,
  CardSubtitle,
  CardTitle,
  CardTitleGroup,
  StyledCard,
} from './card.styled';
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
  <StyledCard as={as} {...rest}>
    {(title || subtitle || actions) && (
      <CardHeader>
        <CardTitleGroup>
          {title && <CardTitle>{title}</CardTitle>}

          {subtitle && <CardSubtitle>{subtitle}</CardSubtitle>}
        </CardTitleGroup>

        {actions && <CardActions>{actions}</CardActions>}
      </CardHeader>
    )}

    <CardBody $padding={padding}>{children}</CardBody>

    {footer && <CardFooter>{footer}</CardFooter>}
  </StyledCard>
);

export default Card;
