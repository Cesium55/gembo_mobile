import { useCallback, useEffect, useState } from 'react';

import { BookDetails, useBooksApi } from '@/hooks/use-books-api';

export function useBookDetails(bookId: number | null) {
  const { getBookById } = useBooksApi();
  const [book, setBook] = useState<BookDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadBook = useCallback(async () => {
    if (!bookId) {
      setBook(null);
      setError('Книга не найдена');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const data = await getBookById(bookId);
      setBook(data);
    } catch (unknownError) {
      const message = unknownError instanceof Error ? unknownError.message : 'Не удалось загрузить книгу';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [bookId, getBookById]);

  useEffect(() => {
    void loadBook();
  }, [loadBook]);

  return {
    book,
    isLoading,
    error,
    reload: loadBook,
  };
}
