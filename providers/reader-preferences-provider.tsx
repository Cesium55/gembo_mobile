import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, PropsWithChildren, useContext, useEffect, useMemo, useState } from 'react';

type ReaderFontFamily = 'sans' | 'serif' | 'rounded';
type LegacyReaderFontSize = 'small' | 'medium' | 'large';

type ReaderPreferencesContextValue = {
  fontFamily: ReaderFontFamily;
  fontSize: number;
  setFontFamily: (value: ReaderFontFamily) => void;
  setFontSize: (value: number) => void;
};

const STORAGE_KEY = 'reader-preferences:v1';
export const MIN_READER_FONT_SIZE = 10;
export const MAX_READER_FONT_SIZE = 30;
const DEFAULT_READER_FONT_SIZE = 18;

const ReaderPreferencesContext = createContext<ReaderPreferencesContextValue | null>(null);

type StoredReaderPreferences = {
  fontFamily?: ReaderFontFamily;
  fontSize?: number | LegacyReaderFontSize;
};

const DEFAULT_FONT_FAMILY: ReaderFontFamily = 'serif';

function isFontFamily(value: unknown): value is ReaderFontFamily {
  return value === 'sans' || value === 'serif' || value === 'rounded';
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
    const payload: StoredReaderPreferences = { fontFamily, fontSize };
    void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }, [fontFamily, fontSize]);

  const setFontSize = (value: number) => {
    setFontSizeState(normalizeFontSize(value));
  };

  const value = useMemo(
    () => ({
      fontFamily,
      fontSize,
      setFontFamily,
      setFontSize,
    }),
    [fontFamily, fontSize],
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
