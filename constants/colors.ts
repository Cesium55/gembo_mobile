export type AppThemeName = 'light' | 'dark';

export type AppTheme = {
  backgroundColor: string;
  cardColor: string;
  textColor: string;
  mutedTextColor: string;
  borderColor: string;
  primaryColor: string;
  onPrimaryColor: string;
};

export const AppThemes: Record<AppThemeName, AppTheme> = {
  light: {
    backgroundColor: '#F6F7F8',
    cardColor: '#FFFFFF',
    textColor: '#111317',
    mutedTextColor: '#67707A',
    borderColor: '#E6E8EC',
    primaryColor: '#2B6EF2',
    onPrimaryColor: '#FFFFFF',
  },
  dark: {
    backgroundColor: '#000000',
    cardColor: '#000000',
    textColor: '#F5F5F5',
    mutedTextColor: '#A3A3A3',
    borderColor: '#1A1A1A',
    primaryColor: '#7CB8FF',
    onPrimaryColor: '#000000',
  },
} as const;
