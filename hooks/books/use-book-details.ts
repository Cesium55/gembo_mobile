import { useCallback, useEffect, useState } from 'react';

import { BookDetails, useBooksApi } from '@/hooks/use-books-api';

export function useBookDetails(bookId: number | null) {
  const { getBookById } = useBooksApi();
  const [book, setBook] = useState<BookDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadBook = useCallback(async () => {
    console.log('[BookDetails] load:start', { bookId });

    if (!bookId) {
      console.log('[BookDetails] load:invalid-book-id', { bookId });
      setBook(null);
      setError('Книга не найдена');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const data = await getBookById(bookId);
      console.log('[BookDetails] load:success', {
        bookId,
        chapterCount: data.chapters.length,
        title: data.title,
      });
      setBook(data);
    } catch (unknownError) {
      const message = unknownError instanceof Error ? unknownError.message : 'Не удалось загрузить книгу';
      console.log('[BookDetails] load:error', { bookId, message });
      setError(message);
    } finally {
      console.log('[BookDetails] load:finish', { bookId });
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
