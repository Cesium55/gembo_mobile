import { DarkTheme, DefaultTheme, Theme } from '@react-navigation/native';
import { createContext, PropsWithChildren, useContext, useState } from 'react';

import { AppTheme, AppThemeName, AppThemes } from '@/constants/colors';

type ThemeContextValue = {
  isDark: boolean;
  themeName: AppThemeName;
  theme: AppTheme;
  navigationTheme: Theme;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function AppThemeProvider({ children }: PropsWithChildren) {
  const [themeName, setThemeName] = useState<AppThemeName>('light');
  const isDark = themeName === 'dark';
  const theme = AppThemes[themeName];
  const base = isDark ? DarkTheme : DefaultTheme;

  const navigationTheme: Theme = {
    ...base,
    colors: {
      ...base.colors,
      background: theme.backgroundColor,
      card: theme.cardColor,
      border: theme.borderColor,
      primary: theme.primaryColor,
      text: theme.textColor,
    },
  };

  const value: ThemeContextValue = {
    isDark,
    themeName,
    theme,
    navigationTheme,
    toggleTheme: () => setThemeName((current) => (current === 'light' ? 'dark' : 'light')),
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useAppTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error('useAppTheme must be used inside AppThemeProvider');
  }

  return context;
}
