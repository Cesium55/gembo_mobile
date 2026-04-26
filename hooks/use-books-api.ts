import { useCallback, useMemo, useState } from 'react';

import { buildBooksUrl } from '@/constants/books-config';

type ValidationErrorItem = {
  type?: string;
  loc?: Array<string | number>;
  msg?: string;
  input?: unknown;
};

type ErrorResponseBody = {
  message?: string;
  detail?: ValidationErrorItem[] | string;
};

export type Book = {
  id: number;
  title: string;
  author: string;
  content: string;
};

export type BookChapter = {
  id: number;
  title: string;
  position: number;
  content: string;
};

export type BookDetails = {
  id: number;
  title: string;
  author: string;
  chapters: BookChapter[];
};

export type CreateBookPayload = {
  title: string;
  author: string;
  content: string;
};

export type UpdateBookPayload = {
  title?: string;
  author?: string;
  content?: string;
};

export type BooksHealthResponse = {
  message: string;
};

function parseErrorBody(raw: string): ErrorResponseBody | null {
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as ErrorResponseBody;
  } catch {
    return null;
  }
}

function formatValidationDetails(detail: ValidationErrorItem[] | string | undefined): string | null {
  if (typeof detail === 'string' && detail.trim()) {
    return detail.trim();
  }

  if (!Array.isArray(detail) || !detail.length) {
    return null;
  }

  const messages = detail.map((item) => item.msg).filter((msg): msg is string => Boolean(msg));
  if (!messages.length) {
    return null;
  }

  return messages.join('; ');
}

function hasAnyDefinedValue(payload: UpdateBookPayload) {
  return payload.title !== undefined || payload.author !== undefined || payload.content !== undefined;
}

export function useBooksApi() {
  const [pendingCount, setPendingCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const request = useCallback(
    async <T>(input: string, init: RequestInit): Promise<T> => {
      setPendingCount((count) => count + 1);
      setError(null);

      try {
        const response = await fetch(buildBooksUrl(input), init);
        if (!response.ok) {
          const raw = await response.text();
          const parsed = parseErrorBody(raw);
          const detailMessage = formatValidationDetails(parsed?.detail);
          const message = parsed?.message ?? detailMessage ?? `Request failed (${response.status})`;
          throw new Error(message);
        }

        if (response.status === 204) {
          return undefined as T;
        }

        return (await response.json()) as T;
      } catch (unknownError) {
        const message = unknownError instanceof Error ? unknownError.message : 'Books request failed';
        setError(message);
        throw unknownError;
      } finally {
        setPendingCount((count) => Math.max(0, count - 1));
      }
    },
    [],
  );

  const getHealth = useCallback(async () => {
    return request<BooksHealthResponse>('/', { method: 'GET' });
  }, [request]);

  const createBook = useCallback(
    async (payload: CreateBookPayload) => {
      if (!payload.title?.trim()) {
        throw new Error('Field "title" is required');
      }
      if (!payload.author?.trim()) {
        throw new Error('Field "author" is required');
      }
      if (!payload.content?.trim()) {
        throw new Error('Field "content" is required');
      }

      return request<Book>('/books/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
    },
    [request],
  );

  const getBooks = useCallback(async () => {
    return request<Book[]>('/books/', { method: 'GET' });
  }, [request]);

  const getBookById = useCallback(
    async (bookId: number) => {
      if (!Number.isInteger(bookId) || bookId <= 0) {
        throw new Error('Parameter "bookId" must be a positive integer');
      }

      return request<BookDetails>(`/books/${bookId}`, { method: 'GET' });
    },
    [request],
  );

  const updateBook = useCallback(
    async (bookId: number, payload: UpdateBookPayload) => {
      if (!Number.isInteger(bookId) || bookId <= 0) {
        throw new Error('Parameter "bookId" must be a positive integer');
      }

      if (!hasAnyDefinedValue(payload)) {
        return request<Book>(`/books/${bookId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({}),
        });
      }

      const normalizedPayload: UpdateBookPayload = {};
      if (payload.title !== undefined) {
        normalizedPayload.title = payload.title;
      }
      if (payload.author !== undefined) {
        normalizedPayload.author = payload.author;
      }
      if (payload.content !== undefined) {
        normalizedPayload.content = payload.content;
      }

      return request<Book>(`/books/${bookId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(normalizedPayload),
      });
    },
    [request],
  );

  const deleteBook = useCallback(
    async (bookId: number) => {
      if (!Number.isInteger(bookId) || bookId <= 0) {
        throw new Error('Parameter "bookId" must be a positive integer');
      }

      await request<void>(`/books/${bookId}`, { method: 'DELETE' });
    },
    [request],
  );

  return useMemo(
    () => ({
      isLoading: pendingCount > 0,
      error,
      clearError,
      getHealth,
      createBook,
      getBooks,
      getBookById,
      updateBook,
      deleteBook,
    }),
    [clearError, createBook, deleteBook, error, getBookById, getBooks, getHealth, pendingCount, updateBook],
  );
}
