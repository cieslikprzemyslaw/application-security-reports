import type {
  CSSProperties,
  ButtonHTMLAttributes,
  MouseEventHandler,
} from 'react';

interface TopbarUserIdentityBaseProps {
  fullName: string;
  role: string;
  'aria-label'?: string;
}

export interface TopbarUserIdentityStaticProps extends TopbarUserIdentityBaseProps {
  className?: string;
  id?: string;
  style?: CSSProperties;
  onClick?: never;
}

export interface TopbarUserIdentityInteractiveProps
  extends
    TopbarUserIdentityBaseProps,
    Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'type'> {
  onClick: MouseEventHandler<HTMLButtonElement>;
}

export type TopbarUserIdentityProps =
  | TopbarUserIdentityStaticProps
  | TopbarUserIdentityInteractiveProps;
