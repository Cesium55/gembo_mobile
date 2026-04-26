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

export type ReaderThemeName = 'light' | 'sepia' | 'paper' | 'dark';
export type ReaderTheme = AppTheme;

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

export const ReaderThemes: Record<ReaderThemeName, ReaderTheme> = {
  light: {
    backgroundColor: '#FFFFFF',
    cardColor: '#FFFFFF',
    textColor: '#111317',
    mutedTextColor: '#6B7280',
    borderColor: '#E5E7EB',
    primaryColor: '#2B6EF2',
    onPrimaryColor: '#FFFFFF',
  },
  sepia: {
    backgroundColor: '#F4ECD8',
    cardColor: '#FBF5E6',
    textColor: '#433422',
    mutedTextColor: '#7B6A55',
    borderColor: '#DDCDAF',
    primaryColor: '#A56A2A',
    onPrimaryColor: '#FFF8ED',
  },
  paper: {
    backgroundColor: '#EDE0C8',
    cardColor: '#F5EBD8',
    textColor: '#3C2F21',
    mutedTextColor: '#766654',
    borderColor: '#D0B998',
    primaryColor: '#8C5A24',
    onPrimaryColor: '#FFF8EF',
  },
  dark: {
    backgroundColor: '#000000',
    cardColor: '#050505',
    textColor: '#F5F5F5',
    mutedTextColor: '#9CA3AF',
    borderColor: '#141414',
    primaryColor: '#8EC5FF',
    onPrimaryColor: '#000000',
  },
} as const;
