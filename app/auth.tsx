import Constants from 'expo-constants';
import { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { Redirect } from 'expo-router';

import { AppText } from '@/components/ui/app-text';
import { ScreenContainer } from '@/components/ui/screen-container';
import { googleSignInConfig } from '@/constants/google-signin-config';
import { useAuth } from '@/providers/auth-provider';
import { useAppTheme } from '@/providers/theme-provider';

type GoogleSigninModule = {
  GoogleSignin: {
    configure: (params: { webClientId?: string; offlineAccess?: boolean }) => void;
    hasPlayServices: (params?: { showPlayServicesUpdateDialog?: boolean }) => Promise<boolean>;
    signIn: () => Promise<{ data?: { idToken?: string | null }; idToken?: string | null }>;
    signOut: () => Promise<void>;
    revokeAccess: () => Promise<void>;
  };
  GoogleSigninButton: {
    (props: { onPress?: () => void; size?: number; color?: 'dark' | 'light'; disabled?: boolean }): React.JSX.Element;
    Size: {
      Wide: number;
    };
    Color: {
      Dark: 'dark';
      Light: 'light';
    };
  };
};

let googleSigninModule: GoogleSigninModule | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  googleSigninModule = require('@react-native-google-signin/google-signin') as GoogleSigninModule;
} catch {
  googleSigninModule = null;
}

function extractGoogleIdToken(response: { data?: { idToken?: string | null }; idToken?: string | null }) {
  return response.data?.idToken ?? response.idToken ?? null;
}

export default function AuthScreen() {
  const { theme } = useAppTheme();
  const { isAuthenticated, isInitializing, loginWithEmail, loginWithGoogle } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isExpoGo = Constants.executionEnvironment === 'storeClient' || Constants.appOwnership === 'expo';
  const canUseGoogle = !isExpoGo && googleSigninModule !== null;

  useEffect(() => {
    if (!canUseGoogle || !googleSigninModule) {
      return;
    }

    googleSigninModule.GoogleSignin.configure({
      webClientId: googleSignInConfig.webClientID || undefined,
      offlineAccess: false,
    });
  }, [canUseGoogle]);

  const googleButtonColor =
    theme.backgroundColor === '#000000' ? googleSigninModule?.GoogleSigninButton.Color.Dark : googleSigninModule?.GoogleSigninButton.Color.Light;

  if (!isInitializing && isAuthenticated) {
    return <Redirect href="/(tabs)" />;
  }

  const handleEmailLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Авторизация', 'Введите email и пароль.');
      return;
    }

    setIsSubmitting(true);
    try {
      await loginWithEmail({ email: email.trim(), password });
    } catch (error) {
      Alert.alert('Ошибка входа', error instanceof Error ? error.message : 'Не удалось выполнить вход.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (!googleSigninModule) {
      Alert.alert('Google Sign-In', 'Модуль недоступен в этом билде.');
      return;
    }

    setIsSubmitting(true);
    try {
      // Force account picker and avoid app-level Google session reuse.
      await googleSigninModule.GoogleSignin.revokeAccess().catch(() => {});
      await googleSigninModule.GoogleSignin.signOut().catch(() => {});

      await googleSigninModule.GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      const response = await googleSigninModule.GoogleSignin.signIn();
      const idToken = extractGoogleIdToken(response);

      if (!idToken) {
        throw new Error('Google idToken не получен.');
      }

      await loginWithGoogle(idToken);
    } catch (error) {
      Alert.alert('Ошибка входа', error instanceof Error ? error.message : 'Не удалось выполнить вход через Google.');
    } finally {
      await googleSigninModule.GoogleSignin.revokeAccess().catch(() => {});
      await googleSigninModule.GoogleSignin.signOut().catch(() => {});
      setIsSubmitting(false);
    }
  };

  return (
    <ScreenContainer>
      <View style={styles.content}>
        <AppText variant="title">Вход</AppText>

        {isExpoGo ? (
          <View style={styles.form}>
            <TextInput
              autoCapitalize="none"
              keyboardType="email-address"
              onChangeText={setEmail}
              placeholder="Email"
              placeholderTextColor={theme.mutedTextColor}
              style={[styles.input, { color: theme.textColor, borderColor: theme.borderColor, backgroundColor: theme.cardColor }]}
              value={email}
            />
            <TextInput
              autoCapitalize="none"
              onChangeText={setPassword}
              placeholder="Пароль"
              placeholderTextColor={theme.mutedTextColor}
              secureTextEntry
              style={[styles.input, { color: theme.textColor, borderColor: theme.borderColor, backgroundColor: theme.cardColor }]}
              value={password}
            />
            <Pressable
              disabled={isSubmitting}
              onPress={handleEmailLogin}
              style={[styles.primaryButton, { backgroundColor: theme.primaryColor, opacity: isSubmitting ? 0.6 : 1 }]}>
              <AppText style={[styles.primaryButtonText, { color: theme.onPrimaryColor }]}>Войти</AppText>
            </Pressable>
          </View>
        ) : (
          <View style={styles.form}>
            {canUseGoogle && googleSigninModule ? (
              <googleSigninModule.GoogleSigninButton
                color={googleButtonColor}
                disabled={isSubmitting}
                onPress={handleGoogleLogin}
                size={googleSigninModule.GoogleSigninButton.Size.Wide}
              />
            ) : (
              <Pressable
                disabled
                style={[styles.disabledButton, { backgroundColor: theme.cardColor, borderColor: theme.borderColor }]}>
                <AppText>Google Sign-In недоступен</AppText>
              </Pressable>
            )}
          </View>
        )}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    gap: 18,
    justifyContent: 'center',
  },
  form: {
    gap: 12,
  },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    fontSize: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  primaryButton: {
    alignItems: 'center',
    borderRadius: 12,
    paddingVertical: 12,
  },
  primaryButtonText: {
    fontWeight: '700',
  },
  disabledButton: {
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 12,
  },
});
