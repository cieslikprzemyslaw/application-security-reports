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
          text: palette.neutral500,
          border: palette.neutral200,
        },
      },

      secondary: {
        default: {
          background: palette.cardBackground,
          text: palette.neutral700,
          border: palette.neutral300,
        },

        hover: {
          background: palette.subtleSurface,
          text: palette.neutral900,
          border: palette.neutral400,
        },

        active: {
          background: palette.neutral100,
          text: palette.neutral900,
          border: palette.neutral400,
        },

        disabled: {
          background: palette.cardBackground,
          text: palette.neutral400,
          border: palette.neutral200,
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
          text: palette.neutral500,
          border: palette.neutral200,
        },
      },
    },
  }) as const;

const lightPalette = {
  brandPrimary: '#1E40AF',
  brandPrimaryHover: '#1A3793',
  brandPrimaryActive: '#15296C',
  brandAccent: '#2C56C6',
  brandWash: '#EEF3FC',

  white: '#FFFFFF',
  black: '#101828',

  neutral25: '#FCFCFD',
  neutral50: '#F9FAFB',
  neutral100: '#F2F4F7',
  neutral200: '#EAECF0',
  neutral300: '#D0D5DD',
  neutral400: '#98A2B3',
  neutral500: '#667085',
  neutral600: '#475467',
  neutral700: '#344054',
  neutral800: '#1D2939',
  neutral900: '#101828',

  pageBackground: '#F4F6FA',
  cardBackground: '#FFFFFF',
  subtleSurface: '#F1F4F9',
  inverseSurface: '#101828',

  textPrimary: '#101828',
  textSecondary: '#475467',
  textMuted: '#667085',
  textInverse: '#FFFFFF',
  textLink: '#1E40AF',
  textLinkHover: '#15296C',

  borderSubtle: '#EAECF0',
  borderDefault: '#D0D5DD',
  borderStrong: '#98A2B3',
  borderFocus: '#88A8E4',

  criticalBackground: '#FDECEC',
  criticalText: '#B01A1A',
  criticalSolid: '#DC2626',
  highBackground: '#FDEEE2',
  highText: '#C2410C',
  highSolid: '#EA580C',
  mediumBackground: '#FCF3DC',
  mediumText: '#9A6A06',
  mediumSolid: '#D9920B',
  lowBackground: '#E6F6EC',
  lowText: '#157F3B',
  lowSolid: '#16A34A',
  infoBackground: '#EEF3FC',
  infoText: '#1A3793',
  infoSolid: '#2C56C6',

  openBackground: '#FDECEC',
  openText: '#B01A1A',
  inProgressBackground: '#EEF3FC',
  inProgressText: '#1A3793',
  resolvedBackground: '#E6F6EC',
  resolvedText: '#157F3B',
  retestBackground: '#FCF3DC',
  retestText: '#9A6A06',
  acceptedBackground: '#F2F4F7',
  acceptedText: '#344054',

  success: '#16A34A',
  warning: '#D9920B',
  error: '#DC2626',
  info: '#2C56C6',
} as const;

const darkPalette = {
  brandPrimary: '#4A78E6',
  brandPrimaryHover: '#5E89EE',
  brandPrimaryActive: '#7BA0F2',
  brandAccent: '#5E89EE',
  brandWash: '#18223A',

  white: '#FFFFFF',
  black: '#101828',

  neutral25: '#0E1421',
  neutral50: '#161E2E',
  neutral100: '#1A2435',
  neutral200: '#202B3F',
  neutral300: '#2A3650',
  neutral400: '#38465F',
  neutral500: '#5E6A82',
  neutral600: '#7C879D',
  neutral700: '#A7B2C6',
  neutral800: '#C8D1E0',
  neutral900: '#E8EDF5',

  pageBackground: '#0E1421',
  cardBackground: '#161E2E',
  subtleSurface: '#1A2435',
  inverseSurface: '#121A28',

  textPrimary: '#E8EDF5',
  textSecondary: '#A7B2C6',
  textMuted: '#7C879D',
  textInverse: '#FFFFFF',
  textLink: '#4A78E6',
  textLinkHover: '#7BA0F2',

  borderSubtle: '#2A3650',
  borderDefault: '#38465F',
  borderStrong: '#5E6A82',
  borderFocus: '#4A78E6',

  criticalBackground: '#3A1B1F',
  criticalText: '#F1A0A0',
  criticalSolid: '#F1A0A0',
  highBackground: '#3A271A',
  highText: '#F3B785',
  highSolid: '#F3B785',
  mediumBackground: '#392F18',
  mediumText: '#ECC979',
  mediumSolid: '#ECC979',
  lowBackground: '#163020',
  lowText: '#87D7A2',
  lowSolid: '#87D7A2',
  infoBackground: '#232C3F',
  infoText: '#A9B6D0',
  infoSolid: '#A9B6D0',

  openBackground: '#3A1B1F',
  openText: '#F1A0A0',
  inProgressBackground: '#1D2A48',
  inProgressText: '#9FBAF2',
  resolvedBackground: '#163020',
  resolvedText: '#87D7A2',
  retestBackground: '#392F18',
  retestText: '#ECC979',
  acceptedBackground: '#232C3F',
  acceptedText: '#A7B2C6',

  success: '#87D7A2',
  warning: '#ECC979',
  error: '#F1A0A0',
  info: '#5E89EE',
} as const;

export const lightColors = createColors(lightPalette);
export const darkColors = createColors(darkPalette);
export const colors = lightColors;

export type ThemeColors = typeof lightColors;
