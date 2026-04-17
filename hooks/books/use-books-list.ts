import { useCallback, useEffect, useState } from 'react';

import { Book, useBooksApi } from '@/hooks/use-books-api';

export function useBooksList() {
  const { getBooks } = useBooksApi();
  const [books, setBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadBooks = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await getBooks();
      setBooks(data);
    } catch (unknownError) {
      const message = unknownError instanceof Error ? unknownError.message : 'Не удалось загрузить книги';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [getBooks]);

  useEffect(() => {
    void loadBooks();
  }, [loadBooks]);

  return {
    books,
    isLoading,
    error,
    reload: loadBooks,
  };
}
