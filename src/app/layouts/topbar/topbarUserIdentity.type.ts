import type { ButtonHTMLAttributes } from 'react';

export interface TopbarUserIdentityProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'children'
> {
  fullName: string;
  role: string;
}
