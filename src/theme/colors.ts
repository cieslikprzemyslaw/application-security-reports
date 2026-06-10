const basePalette = {
  white: '#FFFFFF',
  black: '#101828',

  grey25: '#FCFCFD',
  grey50: '#F9FAFB',
  grey100: '#F2F4F7',
  grey200: '#EAECF0',
  grey300: '#D0D5DD',
  grey400: '#98A2B3',
  grey500: '#667085',
  grey600: '#475467',
  grey700: '#344054',
  grey800: '#1D2939',
  grey900: '#101828',

  blue50: '#EFF4FF',
  blue300: '#84ADFF',
  blue500: '#2970FF',
  blue700: '#004EEB',
  blue800: '#0040C1',
  blue900: '#00359E',

  red50: '#FEF3F2',
  red500: '#F04438',
  red700: '#B42318',

  orange50: '#FFF6ED',
  orange500: '#EF6820',
  orange700: '#B93815',

  amber50: '#FFFAEB',
  amber500: '#F79009',
  amber700: '#B54708',

  green50: '#ECFDF3',
  green500: '#12B76A',
  green700: '#027A48',

  purple50: '#F4F3FF',
  purple700: '#5925DC',
} as const;

export const colors = {
  brand: {
    primary: basePalette.blue700,
    primaryHover: basePalette.blue800,
    primaryActive: basePalette.blue900,
    accent: basePalette.blue500,
    wash: basePalette.blue50,
  },

  neutral: {
    white: basePalette.white,
    black: basePalette.black,
    grey25: basePalette.grey25,
    grey50: basePalette.grey50,
    grey100: basePalette.grey100,
    grey200: basePalette.grey200,
    grey300: basePalette.grey300,
    grey400: basePalette.grey400,
    grey500: basePalette.grey500,
    grey600: basePalette.grey600,
    grey700: basePalette.grey700,
    grey800: basePalette.grey800,
    grey900: basePalette.grey900,
  },

  surface: {
    page: basePalette.grey50,
    card: basePalette.white,
    subtle: basePalette.grey100,
    inverse: basePalette.grey900,
  },

  text: {
    primary: basePalette.grey900,
    secondary: basePalette.grey600,
    muted: basePalette.grey500,
    inverse: basePalette.white,
    link: basePalette.blue700,
    linkHover: basePalette.blue900,
  },

  border: {
    subtle: basePalette.grey200,
    default: basePalette.grey300,
    strong: basePalette.grey400,
    focus: basePalette.blue300,
  },

  severity: {
    critical: {
      background: basePalette.red50,
      text: basePalette.red700,
      solid: basePalette.red500,
    },

    high: {
      background: basePalette.orange50,
      text: basePalette.orange700,
      solid: basePalette.orange500,
    },

    medium: {
      background: basePalette.amber50,
      text: basePalette.amber700,
      solid: basePalette.amber500,
    },

    low: {
      background: basePalette.green50,
      text: basePalette.green700,
      solid: basePalette.green500,
    },

    informational: {
      background: basePalette.blue50,
      text: basePalette.blue800,
      solid: basePalette.blue500,
    },
  },

  status: {
    open: {
      background: basePalette.red50,
      text: basePalette.red700,
    },

    inProgress: {
      background: basePalette.blue50,
      text: basePalette.blue800,
    },

    resolved: {
      background: basePalette.green50,
      text: basePalette.green700,
    },

    retestRequired: {
      background: basePalette.purple50,
      text: basePalette.purple700,
    },

    acceptedRisk: {
      background: basePalette.grey100,
      text: basePalette.grey700,
    },
  },

  feedback: {
    success: basePalette.green500,
    warning: basePalette.amber500,
    error: basePalette.red500,
    info: basePalette.blue500,
  },

  button: {
    primary: {
      default: {
        background: basePalette.blue700,
        text: basePalette.white,
        border: basePalette.blue700,
      },

      hover: {
        background: basePalette.blue800,
        text: basePalette.white,
        border: basePalette.blue800,
      },

      active: {
        background: basePalette.blue900,
        text: basePalette.white,
        border: basePalette.blue900,
      },

      disabled: {
        background: basePalette.grey200,
        text: basePalette.grey500,
        border: basePalette.grey200,
      },
    },

    secondary: {
      default: {
        background: basePalette.white,
        text: basePalette.grey700,
        border: basePalette.grey300,
      },

      hover: {
        background: basePalette.grey50,
        text: basePalette.grey900,
        border: basePalette.grey400,
      },

      active: {
        background: basePalette.grey100,
        text: basePalette.grey900,
        border: basePalette.grey400,
      },

      disabled: {
        background: basePalette.white,
        text: basePalette.grey400,
        border: basePalette.grey200,
      },
    },

    destructive: {
      default: {
        background: basePalette.red500,
        text: basePalette.white,
        border: basePalette.red500,
      },

      hover: {
        background: basePalette.red700,
        text: basePalette.white,
        border: basePalette.red700,
      },

      active: {
        background: basePalette.red700,
        text: basePalette.white,
        border: basePalette.red700,
      },

      disabled: {
        background: basePalette.grey200,
        text: basePalette.grey500,
        border: basePalette.grey200,
      },
    },
  },
} as const;
