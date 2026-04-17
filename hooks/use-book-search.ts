import { useCallback, useMemo, useState } from 'react';

import { buildSearchUrl } from '@/constants/search-config';
import { useAuth } from '@/providers/auth-provider';

type ShardsInfo = {
  total: number;
  successful: number;
  failed: number;
  skipped?: number;
};

type SearchHitSource = {
  author: string;
  title: string;
  language: string;
  text: string | null;
};

type SearchHit = {
  _index: string;
  _id: string;
  _score: number | null;
  _source: SearchHitSource;
  highlight?: Partial<Record<'author' | 'title' | 'text', string[]>>;
};

type SearchHits = {
  total: {
    value: number;
    relation: 'eq' | 'gte' | string;
  };
  max_score: number | null;
  hits: SearchHit[];
};

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

export type SearchHealthResponse = {
  status: string;
  elasticsearch: boolean;
};

export type AddBookPayload = {
  author: string;
  title: string;
  text: string;
  language: string;
};

export type AddBookResponse = {
  _index: string;
  _id: string;
  _version: number;
  result: string;
  _shards: ShardsInfo;
  _seq_no: number;
  _primary_term: number;
  forced_refresh?: boolean | null;
};

export type SearchBooksParams = {
  query: string;
  fragment_size?: number;
  number_of_fragments?: number;
  size?: number;
};

export type SearchByAuthorTitleParams = {
  author: string;
  title: string;
  size?: number;
};

export type SearchBooksResponse = {
  took: number;
  timed_out: boolean;
  _shards: ShardsInfo;
  hits: SearchHits;
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

export function useBookSearch() {
  const { authFetch } = useAuth();
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
        const response = await authFetch(buildSearchUrl(input), init);
        if (!response.ok) {
          const raw = await response.text();
          const parsed = parseErrorBody(raw);
          const detailMessage = formatValidationDetails(parsed?.detail);
          const message = parsed?.message ?? detailMessage ?? `Request failed (${response.status})`;
          throw new Error(message);
        }

        return (await response.json()) as T;
      } catch (unknownError) {
        const message = unknownError instanceof Error ? unknownError.message : 'Search request failed';
        setError(message);
        throw unknownError;
      } finally {
        setPendingCount((count) => Math.max(0, count - 1));
      }
    },
    [authFetch],
  );

  const checkHealth = useCallback(async () => {
    return request<SearchHealthResponse>('/', { method: 'GET' });
  }, [request]);

  const addBook = useCallback(
    async (payload: AddBookPayload) => {
      if (!payload.author?.trim()) {
        throw new Error('Field "author" is required');
      }
      if (!payload.title?.trim()) {
        throw new Error('Field "title" is required');
      }
      if (!payload.text?.trim()) {
        throw new Error('Field "text" is required');
      }
      if (!payload.language?.trim()) {
        throw new Error('Field "language" is required');
      }

      return request<AddBookResponse>('/books/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
    },
    [request],
  );

  const searchBooks = useCallback(
    async ({ query, fragment_size, number_of_fragments, size }: SearchBooksParams) => {
      const normalizedQuery = query.trim();
      if (!normalizedQuery) {
        throw new Error('Parameter "query" is required');
      }

      const params = new URLSearchParams({ query: normalizedQuery });
      if (typeof fragment_size === 'number') {
        params.set('fragment_size', String(fragment_size));
      }
      if (typeof number_of_fragments === 'number') {
        params.set('number_of_fragments', String(number_of_fragments));
      }
      if (typeof size === 'number') {
        params.set('size', String(size));
      }

      return request<SearchBooksResponse>(`/books/search?${params.toString()}`, { method: 'GET' });
    },
    [request],
  );

  const searchByAuthorTitle = useCallback(
    async ({ author, title, size }: SearchByAuthorTitleParams) => {
      const normalizedAuthor = author.trim();
      const normalizedTitle = title.trim();

      if (!normalizedAuthor) {
        throw new Error('Parameter "author" is required');
      }
      if (!normalizedTitle) {
        throw new Error('Parameter "title" is required');
      }

      const params = new URLSearchParams({
        author: normalizedAuthor,
        title: normalizedTitle,
      });

      if (typeof size === 'number') {
        params.set('size', String(size));
      }

      return request<SearchBooksResponse>(`/books/search-by-author-title?${params.toString()}`, { method: 'GET' });
    },
    [request],
  );

  return useMemo(
    () => ({
      isLoading: pendingCount > 0,
      error,
      clearError,
      checkHealth,
      addBook,
      searchBooks,
      searchByAuthorTitle,
    }),
    [addBook, checkHealth, clearError, error, pendingCount, searchBooks, searchByAuthorTitle],
  );
}
