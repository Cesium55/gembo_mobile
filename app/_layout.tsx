import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { ThemeProvider } from '@react-navigation/native';
import { Stack, usePathname, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';
import { useEffect } from 'react';

import { useAuth, AuthProvider } from '@/providers/auth-provider';
import { AppThemeProvider, useAppTheme } from '@/providers/theme-provider';

function RootNavigator() {
  const { isDark, navigationTheme, theme } = useAppTheme();
  const { isAuthenticated, isInitializing } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (isInitializing) {
      return;
    }

    const isAuthRoute = pathname === '/auth';
    const isIndexRoute = pathname === '/';
    const isProtectedRoute = !isAuthRoute && !isIndexRoute;

    if (!isAuthenticated && isProtectedRoute) {
      router.replace('/auth');
      return;
    }

    if (isAuthenticated && (isIndexRoute || isAuthRoute)) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, isInitializing, pathname, router]);

  return (
    <ThemeProvider value={navigationTheme}>
      <BottomSheetModalProvider>
        <View style={[styles.root, { backgroundColor: theme.backgroundColor }]}>
          <Stack
            screenOptions={{
              animation: 'slide_from_right',
              contentStyle: { backgroundColor: theme.backgroundColor },
              headerStyle: { backgroundColor: theme.cardColor },
              headerShadowVisible: false,
              headerTintColor: theme.textColor,
              headerTitleStyle: { color: theme.textColor },
            }}>
            <Stack.Screen
              name="index"
              options={{
                headerShown: false,
                contentStyle: { backgroundColor: theme.backgroundColor },
              }}
            />
            <Stack.Screen
              name="auth"
              options={{
                headerShown: false,
                contentStyle: { backgroundColor: theme.backgroundColor },
              }}
            />
            <Stack.Screen
              name="(tabs)"
              options={{
                headerShown: false,
                contentStyle: { backgroundColor: theme.backgroundColor },
              }}
            />
            <Stack.Screen
              name="settings"
              options={{
                title: 'Настройки',
                contentStyle: { backgroundColor: theme.backgroundColor },
              }}
            />
            <Stack.Screen
              name="chat-room"
              options={{
                title: '',
                contentStyle: { backgroundColor: theme.backgroundColor },
              }}
            />
          </Stack>
        </View>
      </BottomSheetModalProvider>
      <StatusBar style={isDark ? 'light' : 'dark'} />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <AppThemeProvider>
        <AuthProvider>
          <RootNavigator />
        </AuthProvider>
      </AppThemeProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
