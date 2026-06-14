import type {
  CSSProperties,
  ButtonHTMLAttributes,
  MouseEventHandler,
} from 'react';

interface TopbarUserIdentityBaseProps {
  fullName: string;
  role: string;
  'aria-label'?: string;
  className?: string;
  id?: string;
  style?: CSSProperties;
}

export interface TopbarUserIdentityStaticProps extends TopbarUserIdentityBaseProps {
  onClick?: never;
}

export interface TopbarUserIdentityInteractiveProps
  extends
    TopbarUserIdentityBaseProps,
    Omit<
      ButtonHTMLAttributes<HTMLButtonElement>,
      'children' | 'className' | 'id' | 'role' | 'style' | 'type' | 'aria-label'
    > {
  onClick: MouseEventHandler<HTMLButtonElement>;
}

export type TopbarUserIdentityProps =
  | TopbarUserIdentityStaticProps
  | TopbarUserIdentityInteractiveProps;
