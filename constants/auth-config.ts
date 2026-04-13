import Constants from 'expo-constants';

type AuthConfig = {
  serverUrl: string;
};

const defaultConfig: AuthConfig = {
  serverUrl: '',
};

const extraAuthConfig = Constants.expoConfig?.extra?.auth as Partial<AuthConfig> | undefined;

export const authConfig: AuthConfig = {
  serverUrl: extraAuthConfig?.serverUrl ?? defaultConfig.serverUrl,
};
