import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

const BOOK_PAGE_CACHE_PREFIX = 'book-reader-page:';
const STORAGE_VERSION = 1;

type StoredBookPageCache = {
  page?: number;
  version?: number;
};

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

function parseSavedPage(raw: string | null) {
  if (!raw) {
    return 0;
  }

  try {
    const parsed = JSON.parse(raw) as StoredBookPageCache;
    if (typeof parsed?.page === 'number' && Number.isFinite(parsed.page)) {
      return parsed.page;
    }
  } catch {
    const legacyPage = Number.parseInt(raw, 10);
    if (Number.isFinite(legacyPage)) {
      return legacyPage;
    }
  }

  return 0;
}

export function useBookPageCache(bookId: number | null, totalPages: number) {
  const [currentPage, setCurrentPage] = useState(0);
  const [isRestoring, setIsRestoring] = useState(true);
  const totalPagesRef = useRef(totalPages);
  const restoredPageRef = useRef(0);
  const hasPendingRestoreRef = useRef(false);

  const storageKey = useMemo(() => {
    if (!bookId) {
      return null;
    }

    return `${BOOK_PAGE_CACHE_PREFIX}${bookId}`;
  }, [bookId]);

  useEffect(() => {
    totalPagesRef.current = totalPages;
  }, [totalPages]);

  useEffect(() => {
    let isMounted = true;

    const restore = async () => {
      if (!storageKey) {
        console.log('[BookPageCache] restore:skip', { bookId, reason: 'missing-storage-key' });
        if (isMounted) {
          setCurrentPage(0);
          setIsRestoring(false);
        }
        return;
      }

      console.log('[BookPageCache] restore:start', { bookId, storageKey, totalPages: totalPagesRef.current });
      setIsRestoring(true);

      try {
        const raw = await AsyncStorage.getItem(storageKey);
        const savedPage = parseSavedPage(raw);
        console.log('[BookPageCache] restore:raw', { bookId, raw, savedPage });
        restoredPageRef.current = savedPage;
        hasPendingRestoreRef.current = true;

        if (isMounted) {
          if (totalPagesRef.current > 0) {
            console.log('[BookPageCache] restore:apply-immediate', {
              bookId,
              savedPage,
              totalPages: totalPagesRef.current,
            });
            setCurrentPage(clampPage(savedPage, totalPagesRef.current));
            hasPendingRestoreRef.current = false;
          } else {
            console.log('[BookPageCache] restore:defer', { bookId, savedPage });
            setCurrentPage(0);
          }
        }
      } catch {
        if (isMounted) {
          console.log('[BookPageCache] restore:error', { bookId });
          restoredPageRef.current = 0;
          hasPendingRestoreRef.current = false;
          setCurrentPage(0);
        }
      } finally {
        if (isMounted) {
          console.log('[BookPageCache] restore:finish', { bookId });
          setIsRestoring(false);
        }
      }
    };

    void restore();

    return () => {
      isMounted = false;
    };
  }, [storageKey]);

  useEffect(() => {
    if (!hasPendingRestoreRef.current || totalPages <= 0) {
      return;
    }

    console.log('[BookPageCache] restore:apply-deferred', {
      bookId,
      restoredPage: restoredPageRef.current,
      totalPages,
    });
    hasPendingRestoreRef.current = false;
    setCurrentPage(clampPage(restoredPageRef.current, totalPages));
  }, [bookId, totalPages]);

  useEffect(() => {
    setCurrentPage((previous) => clampPage(previous, totalPages));
  }, [totalPages]);

  useEffect(() => {
    if (!storageKey || isRestoring || hasPendingRestoreRef.current || totalPages <= 0) {
      return;
    }

    const payload: StoredBookPageCache = {
      page: clampPage(currentPage, totalPages),
      version: STORAGE_VERSION,
    };

    console.log('[BookPageCache] persist', { bookId, storageKey, payload, totalPages });
    void AsyncStorage.setItem(storageKey, JSON.stringify(payload));
  }, [bookId, currentPage, isRestoring, storageKey, totalPages]);

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
