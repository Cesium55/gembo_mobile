import Constants from 'expo-constants';

type BooksConfig = {
  serverUrl: string;
};

const defaultConfig: BooksConfig = {
  serverUrl: '',
};

const extra = Constants.expoConfig?.extra as
  | {
      books?: {
        serverUrl?: string;
      };
    }
  | undefined;

function normalizeBaseUrl(url: string) {
  return url.trim().replace(/\/+$/, '');
}

export function buildBooksUrl(path: string) {
  const baseUrl = normalizeBaseUrl(extra?.books?.serverUrl ?? defaultConfig.serverUrl);

  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }

  if (!baseUrl) {
    throw new Error('Books server URL is not configured. Set expo.extra.books.serverUrl in app.json.');
  }

  if (path.startsWith('/')) {
    return `${baseUrl}${path}`;
  }

  return `${baseUrl}/${path}`;
}

export const booksConfig: BooksConfig = {
  serverUrl: normalizeBaseUrl(extra?.books?.serverUrl ?? defaultConfig.serverUrl),
};
