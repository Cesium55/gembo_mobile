import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, PropsWithChildren, useContext, useEffect, useMemo, useState } from 'react';

import { ReaderThemeName } from '@/constants/colors';

type ReaderFontFamily = 'sans' | 'serif' | 'rounded';
type LegacyReaderFontSize = 'small' | 'medium' | 'large';

type ReaderPreferencesContextValue = {
  fontFamily: ReaderFontFamily;
  fontSize: number;
  readerThemeName: ReaderThemeName;
  setFontFamily: (value: ReaderFontFamily) => void;
  setFontSize: (value: number) => void;
  setReaderThemeName: (value: ReaderThemeName) => void;
};

const STORAGE_KEY = 'reader-preferences:v1';
export const MIN_READER_FONT_SIZE = 10;
export const MAX_READER_FONT_SIZE = 30;
const DEFAULT_READER_FONT_SIZE = 18;

const ReaderPreferencesContext = createContext<ReaderPreferencesContextValue | null>(null);

type StoredReaderPreferences = {
  fontFamily?: ReaderFontFamily;
  fontSize?: number | LegacyReaderFontSize;
  readerThemeName?: ReaderThemeName;
};

const DEFAULT_FONT_FAMILY: ReaderFontFamily = 'serif';
const DEFAULT_READER_THEME: ReaderThemeName = 'light';

function isFontFamily(value: unknown): value is ReaderFontFamily {
  return value === 'sans' || value === 'serif' || value === 'rounded';
}

function isReaderThemeName(value: unknown): value is ReaderThemeName {
  return value === 'light' || value === 'sepia' || value === 'paper' || value === 'dark';
}

function normalizeFontSize(value: unknown) {
  if (value === 'small') {
    return 16;
  }
  if (value === 'medium') {
    return 18;
  }
  if (value === 'large') {
    return 20;
  }
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return DEFAULT_READER_FONT_SIZE;
  }

  return Math.min(Math.max(Math.round(value), MIN_READER_FONT_SIZE), MAX_READER_FONT_SIZE);
}

export function ReaderPreferencesProvider({ children }: PropsWithChildren) {
  const [fontFamily, setFontFamily] = useState<ReaderFontFamily>(DEFAULT_FONT_FAMILY);
  const [fontSize, setFontSizeState] = useState(DEFAULT_READER_FONT_SIZE);
  const [readerThemeName, setReaderThemeName] = useState<ReaderThemeName>(DEFAULT_READER_THEME);

  useEffect(() => {
    let isMounted = true;

    const restore = async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (!raw || !isMounted) {
          return;
        }

        const parsed = JSON.parse(raw) as StoredReaderPreferences;
        if (isFontFamily(parsed.fontFamily)) {
          setFontFamily(parsed.fontFamily);
        }
        if (isReaderThemeName(parsed.readerThemeName)) {
          setReaderThemeName(parsed.readerThemeName);
        }

        setFontSizeState(normalizeFontSize(parsed.fontSize));
      } catch {
        // Ignore invalid cached preferences and keep defaults.
      }
    };

    void restore();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const payload: StoredReaderPreferences = { fontFamily, fontSize, readerThemeName };
    void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }, [fontFamily, fontSize, readerThemeName]);

  const setFontSize = (value: number) => {
    setFontSizeState(normalizeFontSize(value));
  };

  const value = useMemo(
    () => ({
      fontFamily,
      fontSize,
      readerThemeName,
      setFontFamily,
      setFontSize,
      setReaderThemeName,
    }),
    [fontFamily, fontSize, readerThemeName],
  );

  return <ReaderPreferencesContext.Provider value={value}>{children}</ReaderPreferencesContext.Provider>;
}

export function useReaderPreferences() {
  const context = useContext(ReaderPreferencesContext);

  if (!context) {
    throw new Error('useReaderPreferences must be used inside ReaderPreferencesProvider');
  }

  return context;
}

export type { ReaderFontFamily };
