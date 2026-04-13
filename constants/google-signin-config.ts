import Constants from 'expo-constants';

type GoogleSignInConfig = {
  webClientID: string;
  androidClientID: string;
};

const defaultConfig: GoogleSignInConfig = {
  webClientID: '',
  androidClientID: '',
};

const extraConfig = Constants.expoConfig?.extra?.googleSignIn as Partial<GoogleSignInConfig> | undefined;

export const googleSignInConfig: GoogleSignInConfig = {
  webClientID: extraConfig?.webClientID ?? defaultConfig.webClientID,
  androidClientID: extraConfig?.androidClientID ?? defaultConfig.androidClientID,
};
