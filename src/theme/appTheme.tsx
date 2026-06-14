import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
} from 'react';
import type { DefaultTheme } from 'styled-components';
import { ThemeProvider as StyledThemeProvider } from 'styled-components';

import type { ThemePreference } from '~/domain/settings';

import { darkColors, lightColors } from './colors';
import { breakpoints, grid, layoutSizes, mq, spacing } from './layout';
import { radii } from './radii';
import { shadows } from './shadows';
import { tags } from './tags';
import { transitions } from './transitions';
import { typography } from './typography';
import { zIndices } from './zIndices';

export const themePreferenceStorageKey = 'appsec-theme-preference';

export type ResolvedThemePreference = 'light' | 'dark';

export const lightTheme: DefaultTheme = {
  colors: lightColors,
  breakpoints,
  mq,
  spacing,
  grid,
  layoutSizes,
  typography,
  radii,
  shadows,
  transitions,
  zIndices,
  tags,
};

export const darkTheme: DefaultTheme = {
  colors: darkColors,
  breakpoints,
  mq,
  spacing,
  grid,
  layoutSizes,
  typography,
  radii,
  shadows,
  transitions,
  zIndices,
  tags,
};

export const defaultTheme = lightTheme;

export interface ThemePreferenceContextValue {
  themePreference: ThemePreference;
  resolvedTheme: ResolvedThemePreference;
  setThemePreference: (preference: ThemePreference) => void;
}

type LegacyMediaQueryList = MediaQueryList & {
  addListener?: (listener: (event: MediaQueryListEvent) => void) => void;
  removeListener?: (listener: (event: MediaQueryListEvent) => void) => void;
};

const ThemePreferenceContext =
  createContext<ThemePreferenceContextValue | null>(null);

const isThemePreference = (value: string | null): value is ThemePreference =>
  value === 'light' || value === 'dark' || value === 'system';

const getStoredThemePreference = (): ThemePreference => {
  if (typeof window === 'undefined') {
    return 'system';
  }

  try {
    const storedValue = window.localStorage.getItem(themePreferenceStorageKey);

    return isThemePreference(storedValue) ? storedValue : 'system';
  } catch {
    return 'system';
  }
};

const getSystemThemePreference = (): ResolvedThemePreference => {
  if (
    typeof window === 'undefined' ||
    typeof window.matchMedia !== 'function'
  ) {
    return 'light';
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
};

const addMediaQueryListener = (
  mediaQueryList: MediaQueryList,
  listener: (event: MediaQueryListEvent) => void,
): (() => void) => {
  if (typeof mediaQueryList.addEventListener === 'function') {
    mediaQueryList.addEventListener('change', listener);

    return () => {
      mediaQueryList.removeEventListener('change', listener);
    };
  }

  const legacyMediaQueryList = mediaQueryList as LegacyMediaQueryList;

  legacyMediaQueryList.addListener?.(listener);

  return () => {
    legacyMediaQueryList.removeListener?.(listener);
  };
};

export const useThemePreference = () => {
  const context = useContext(ThemePreferenceContext);

  if (!context) {
    throw new Error('useThemePreference must be used within AppThemeProvider');
  }

  return context;
};

export const AppThemeProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [themePreference, setThemePreference] = useState<ThemePreference>(
    getStoredThemePreference,
  );

  const [systemTheme, setSystemTheme] = useState<ResolvedThemePreference>(
    getSystemThemePreference,
  );

  const updateThemePreference = useCallback((preference: ThemePreference) => {
    setThemePreference(preference);
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(themePreferenceStorageKey, themePreference);
    } catch {
      // Continue with the in-memory preference.
    }
  }, [themePreference]);

  useEffect(() => {
    if (
      themePreference !== 'system' ||
      typeof window.matchMedia !== 'function'
    ) {
      return undefined;
    }

    const mediaQueryList = window.matchMedia('(prefers-color-scheme: dark)');

    const updateSystemTheme = () => {
      setSystemTheme(mediaQueryList.matches ? 'dark' : 'light');
    };

    updateSystemTheme();

    return addMediaQueryListener(mediaQueryList, updateSystemTheme);
  }, [themePreference]);

  const resolvedTheme =
    themePreference === 'system' ? systemTheme : themePreference;

  useLayoutEffect(() => {
    if (typeof document === 'undefined') {
      return;
    }

    const root = document.documentElement;

    root.dataset.theme = resolvedTheme;
    root.style.colorScheme = resolvedTheme;
  }, [resolvedTheme]);

  const theme = useMemo(
    () => (resolvedTheme === 'dark' ? darkTheme : lightTheme),
    [resolvedTheme],
  );

  const contextValue = useMemo<ThemePreferenceContextValue>(
    () => ({
      themePreference,
      resolvedTheme,
      setThemePreference: updateThemePreference,
    }),
    [resolvedTheme, themePreference, updateThemePreference],
  );

  return (
    <ThemePreferenceContext.Provider value={contextValue}>
      {' '}
      <StyledThemeProvider theme={theme}>{children} </StyledThemeProvider>
    </ThemePreferenceContext.Provider>
  );
};

export const LightThemeProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => <StyledThemeProvider theme={lightTheme}>{children} </StyledThemeProvider>;
