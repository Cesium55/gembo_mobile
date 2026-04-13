import Constants from 'expo-constants';

type AIConfig = {
  serverUrl: string;
};

const defaultConfig: AIConfig = {
  serverUrl: '',
};

const extra = Constants.expoConfig?.extra as { ai_server?: string } | undefined;

function normalizeBaseUrl(url: string) {
  return url.trim().replace(/\/+$/, '');
}

export function buildAiUrl(path: string) {
  const baseUrl = normalizeBaseUrl(extra?.ai_server ?? defaultConfig.serverUrl);

  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }

  if (!baseUrl) {
    throw new Error('AI server URL is not configured. Set expo.extra.ai_server in app.json.');
  }

  if (path.startsWith('/')) {
    return `${baseUrl}${path}`;
  }

  return `${baseUrl}/${path}`;
}

export const aiConfig: AIConfig = {
  serverUrl: normalizeBaseUrl(extra?.ai_server ?? defaultConfig.serverUrl),
};
