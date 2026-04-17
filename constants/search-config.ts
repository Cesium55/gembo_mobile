import Constants from 'expo-constants';

type SearchConfig = {
  serverUrl: string;
};

const defaultConfig: SearchConfig = {
  serverUrl: '',
};

const extra = Constants.expoConfig?.extra as
  | {
      search?: {
        serverUrl?: string;
      };
    }
  | undefined;

function normalizeBaseUrl(url: string) {
  return url.trim().replace(/\/+$/, '');
}

export function buildSearchUrl(path: string) {
  const baseUrl = normalizeBaseUrl(extra?.search?.serverUrl ?? defaultConfig.serverUrl);

  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }

  if (!baseUrl) {
    throw new Error('Search server URL is not configured. Set expo.extra.search.serverUrl in app.json.');
  }

  if (path.startsWith('/')) {
    return `${baseUrl}${path}`;
  }

  return `${baseUrl}/${path}`;
}

export const searchConfig: SearchConfig = {
  serverUrl: normalizeBaseUrl(extra?.search?.serverUrl ?? defaultConfig.serverUrl),
};
