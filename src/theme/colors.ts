const createColors = (palette: {
  brandPrimary: string;
  brandPrimaryHover: string;
  brandPrimaryActive: string;
  brandAccent: string;
  brandWash: string;

  white: string;
  black: string;

  neutral25: string;
  neutral50: string;
  neutral100: string;
  neutral200: string;
  neutral300: string;
  neutral400: string;
  neutral500: string;
  neutral600: string;
  neutral700: string;
  neutral800: string;
  neutral900: string;

  pageBackground: string;
  cardBackground: string;
  subtleSurface: string;
  inverseSurface: string;

  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  textInverse: string;
  textInverseSecondary: string;
  textInverseMuted: string;
  textLink: string;
  textLinkHover: string;

  borderSubtle: string;
  borderDefault: string;
  borderStrong: string;
  borderFocus: string;

  criticalBackground: string;
  criticalText: string;
  criticalSolid: string;
  highBackground: string;
  highText: string;
  highSolid: string;
  mediumBackground: string;
  mediumText: string;
  mediumSolid: string;
  lowBackground: string;
  lowText: string;
  lowSolid: string;
  infoBackground: string;
  infoText: string;
  infoSolid: string;

  openBackground: string;
  openText: string;
  inProgressBackground: string;
  inProgressText: string;
  resolvedBackground: string;
  resolvedText: string;
  retestBackground: string;
  retestText: string;
  acceptedBackground: string;
  acceptedText: string;

  success: string;
  warning: string;
  error: string;
  info: string;
}) =>
  ({
    brand: {
      primary: palette.brandPrimary,
      primaryHover: palette.brandPrimaryHover,
      primaryActive: palette.brandPrimaryActive,
      accent: palette.brandAccent,
      wash: palette.brandWash,
    },

    neutral: {
      white: palette.white,
      black: palette.black,
      grey25: palette.neutral25,
      grey50: palette.neutral50,
      grey100: palette.neutral100,
      grey200: palette.neutral200,
      grey300: palette.neutral300,
      grey400: palette.neutral400,
      grey500: palette.neutral500,
      grey600: palette.neutral600,
      grey700: palette.neutral700,
      grey800: palette.neutral800,
      grey900: palette.neutral900,
    },

    surface: {
      page: palette.pageBackground,
      card: palette.cardBackground,
      subtle: palette.subtleSurface,
      inverse: palette.inverseSurface,
    },

    text: {
      primary: palette.textPrimary,
      secondary: palette.textSecondary,
      muted: palette.textMuted,
      inverse: palette.textInverse,
      inverseSecondary: palette.textInverseSecondary,
      inverseMuted: palette.textInverseMuted,
      link: palette.textLink,
      linkHover: palette.textLinkHover,
    },

    border: {
      subtle: palette.borderSubtle,
      default: palette.borderDefault,
      strong: palette.borderStrong,
      focus: palette.borderFocus,
    },

    severity: {
      critical: {
        background: palette.criticalBackground,
        text: palette.criticalText,
        solid: palette.criticalSolid,
      },

      high: {
        background: palette.highBackground,
        text: palette.highText,
        solid: palette.highSolid,
      },

      medium: {
        background: palette.mediumBackground,
        text: palette.mediumText,
        solid: palette.mediumSolid,
      },

      low: {
        background: palette.lowBackground,
        text: palette.lowText,
        solid: palette.lowSolid,
      },

      informational: {
        background: palette.infoBackground,
        text: palette.infoText,
        solid: palette.infoSolid,
      },
    },

    status: {
      open: {
        background: palette.openBackground,
        text: palette.openText,
      },

      inProgress: {
        background: palette.inProgressBackground,
        text: palette.inProgressText,
      },

      resolved: {
        background: palette.resolvedBackground,
        text: palette.resolvedText,
      },

      retestRequired: {
        background: palette.retestBackground,
        text: palette.retestText,
      },

      acceptedRisk: {
        background: palette.acceptedBackground,
        text: palette.acceptedText,
      },
    },

    feedback: {
      success: palette.success,
      warning: palette.warning,
      error: palette.error,
      info: palette.info,
    },

    button: {
      primary: {
        default: {
          background: palette.brandPrimary,
          text: palette.white,
          border: palette.brandPrimary,
        },

        hover: {
          background: palette.brandPrimaryHover,
          text: palette.white,
          border: palette.brandPrimaryHover,
        },

        active: {
          background: palette.brandPrimaryActive,
          text: palette.white,
          border: palette.brandPrimaryActive,
        },

        disabled: {
          background: palette.neutral200,
          text: palette.neutral600,
          border: palette.neutral400,
        },
      },

      secondary: {
        default: {
          background: palette.cardBackground,
          text: palette.textPrimary,
          border: palette.borderDefault,
        },

        hover: {
          background: palette.subtleSurface,
          text: palette.textPrimary,
          border: palette.borderStrong,
        },

        active: {
          background: palette.neutral200,
          text: palette.textPrimary,
          border: palette.borderStrong,
        },

        disabled: {
          background: palette.neutral100,
          text: palette.neutral600,
          border: palette.neutral400,
        },
      },

      destructive: {
        default: {
          background: palette.criticalSolid,
          text: palette.white,
          border: palette.criticalSolid,
        },

        hover: {
          background: palette.criticalText,
          text: palette.white,
          border: palette.criticalText,
        },

        active: {
          background: palette.criticalText,
          text: palette.white,
          border: palette.criticalText,
        },

        disabled: {
          background: palette.neutral200,
          text: palette.neutral600,
          border: palette.neutral400,
        },
      },
    },
  }) as const;

const lightPalette = {
  brandPrimary: '#2563EB',
  brandPrimaryHover: '#1D4ED8',
  brandPrimaryActive: '#1E40AF',
  brandAccent: '#0EA5E9',
  brandWash: '#DBEAFE',

  white: '#FFFFFF',
  black: '#0A1830',

  neutral25: '#FBFDFF',
  neutral50: '#F6FAFF',
  neutral100: '#EEF4FF',
  neutral200: '#E2E8F0',
  neutral300: '#C7D3E3',
  neutral400: '#94A3B8',
  neutral500: '#64748B',
  neutral600: '#475569',
  neutral700: '#334155',
  neutral800: '#1E293B',
  neutral900: '#0F172A',

  pageBackground: '#F4F8FF',
  cardBackground: '#FFFFFF',
  subtleSurface: '#EEF4FF',
  inverseSurface: '#164E8A',

  textPrimary: '#0F172A',
  textSecondary: '#334155',
  textMuted: '#475569',
  textInverse: '#FFFFFF',
  textInverseSecondary: '#E6F1FF',
  textInverseMuted: '#C3D9F2',
  textLink: '#1D4ED8',
  textLinkHover: '#1E3A8A',

  borderSubtle: '#D6E1F0',
  borderDefault: '#7C91B0',
  borderStrong: '#536A8A',
  borderFocus: '#0B63CE',

  criticalBackground: '#FDE8E8',
  criticalText: '#991B1B',
  criticalSolid: '#B91C1C',
  highBackground: '#FFF1E6',
  highText: '#9A3412',
  highSolid: '#C2410C',
  mediumBackground: '#FFF7D6',
  mediumText: '#713F12',
  mediumSolid: '#A16207',
  lowBackground: '#E7F7ED',
  lowText: '#166534',
  lowSolid: '#15803D',
  infoBackground: '#E6F2FF',
  infoText: '#1E40AF',
  infoSolid: '#2563EB',

  openBackground: '#FDE8E8',
  openText: '#991B1B',
  inProgressBackground: '#E6F2FF',
  inProgressText: '#1E40AF',
  resolvedBackground: '#E7F7ED',
  resolvedText: '#166534',
  retestBackground: '#FFF7D6',
  retestText: '#713F12',
  acceptedBackground: '#E8EEF6',
  acceptedText: '#334155',

  success: '#166534',
  warning: '#854D0E',
  error: '#B91C1C',
  info: '#1D4ED8',
} as const;

const darkPalette = {
  brandPrimary: '#2F6FE4',
  brandPrimaryHover: '#2563EB',
  brandPrimaryActive: '#1D4ED8',
  brandAccent: '#38BDF8',
  brandWash: '#1E3A5F',

  white: '#FFFFFF',
  black: '#0B1320',

  neutral25: '#111827',
  neutral50: '#151E2C',
  neutral100: '#1B2636',
  neutral200: '#263449',
  neutral300: '#35465D',
  neutral400: '#50637A',
  neutral500: '#75869A',
  neutral600: '#A7B3C2',
  neutral700: '#CAD4E1',
  neutral800: '#E2E8F0',
  neutral900: '#F8FAFC',

  pageBackground: '#111827',
  cardBackground: '#182235',
  subtleSurface: '#202C3D',
  inverseSurface: '#13233A',

  textPrimary: '#F1F5F9',
  textSecondary: '#D7E0EA',
  textMuted: '#AEBCCC',
  textInverse: '#FFFFFF',
  textInverseSecondary: '#DCEAFF',
  textInverseMuted: '#BDD2EA',
  textLink: '#8FC7FF',
  textLinkHover: '#B9DDFF',

  borderSubtle: '#314158',
  borderDefault: '#6B7F99',
  borderStrong: '#91A3B8',
  borderFocus: '#7CC4FF',

  criticalBackground: '#3A1D24',
  criticalText: '#FCA5A5',
  criticalSolid: '#B91C1C',
  highBackground: '#3B281D',
  highText: '#FDBA74',
  highSolid: '#C2410C',
  mediumBackground: '#393217',
  mediumText: '#FDE68A',
  mediumSolid: '#A16207',
  lowBackground: '#183B29',
  lowText: '#86EFAC',
  lowSolid: '#15803D',
  infoBackground: '#1E3A5F',
  infoText: '#BFDBFE',
  infoSolid: '#2F6FE4',

  openBackground: '#3A1D24',
  openText: '#FCA5A5',
  inProgressBackground: '#1E3A5F',
  inProgressText: '#BFDBFE',
  resolvedBackground: '#183B29',
  resolvedText: '#86EFAC',
  retestBackground: '#393217',
  retestText: '#FDE68A',
  acceptedBackground: '#263449',
  acceptedText: '#D7E0EA',

  success: '#86EFAC',
  warning: '#FDE68A',
  error: '#FCA5A5',
  info: '#8FC7FF',
} as const;

export const lightColors = createColors(lightPalette);
export const darkColors = createColors(darkPalette);
export const colors = lightColors;

export type ThemeColors = typeof lightColors;
