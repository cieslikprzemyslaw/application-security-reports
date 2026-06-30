export type CompanyAvatarTone =
  | 'blue'
  | 'cyan'
  | 'orange'
  | 'green'
  | 'purple'
  | 'slate';

export type CompanyAvatarSize = 'small' | 'medium' | 'large';

export interface CompanyAvatarProps {
  companyName: string;
  logoUrl?: string | null;
  initials?: string;
  tone?: CompanyAvatarTone;
  size?: CompanyAvatarSize;
  className?: string;
  isDecorative?: boolean;
  ariaLabel?: string;
}

export interface CompanyAvatarStyledProps {
  $tone: CompanyAvatarTone;
  $size: CompanyAvatarSize;
}
