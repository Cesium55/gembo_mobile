import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useMemo, useState } from 'react';

const BOOK_PAGE_CACHE_PREFIX = 'book-reader-page:';

function clampPage(page: number, totalPages: number) {
  if (totalPages <= 1) {
    return 0;
  }

  if (!Number.isFinite(page) || page < 0) {
    return 0;
  }

  if (page >= totalPages) {
    return totalPages - 1;
  }

  return Math.floor(page);
}

export function useBookPageCache(bookId: number | null, totalPages: number) {
  const [currentPage, setCurrentPage] = useState(0);
  const [isRestoring, setIsRestoring] = useState(true);

  const storageKey = useMemo(() => {
    if (!bookId) {
      return null;
    }

    return `${BOOK_PAGE_CACHE_PREFIX}${bookId}`;
  }, [bookId]);

  useEffect(() => {
    let isMounted = true;

    const restore = async () => {
      if (!storageKey) {
        if (isMounted) {
          setCurrentPage(0);
          setIsRestoring(false);
        }
        return;
      }

      setIsRestoring(true);

      try {
        const raw = await AsyncStorage.getItem(storageKey);
        const savedPage = raw ? Number.parseInt(raw, 10) : 0;

        if (isMounted) {
          setCurrentPage(clampPage(savedPage, totalPages));
        }
      } catch {
        if (isMounted) {
          setCurrentPage(0);
        }
      } finally {
        if (isMounted) {
          setIsRestoring(false);
        }
      }
    };

    void restore();

    return () => {
      isMounted = false;
    };
  }, [storageKey, totalPages]);

  useEffect(() => {
    setCurrentPage((previous) => clampPage(previous, totalPages));
  }, [totalPages]);

  useEffect(() => {
    if (!storageKey || isRestoring) {
      return;
    }

    void AsyncStorage.setItem(storageKey, String(clampPage(currentPage, totalPages)));
  }, [currentPage, isRestoring, storageKey, totalPages]);

  const handleSetPage = useCallback(
    (page: number) => {
      setCurrentPage(clampPage(page, totalPages));
    },
    [totalPages],
  );

  return {
    currentPage,
    isRestoring,
    setCurrentPage: handleSetPage,
  };
}
