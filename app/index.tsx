import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Redirect } from 'expo-router';

import { useAuth } from '@/providers/auth-provider';
import { useAppTheme } from '@/providers/theme-provider';

export default function IndexScreen() {
  const { isAuthenticated, isInitializing } = useAuth();
  const { theme } = useAppTheme();

  if (isInitializing) {
    return (
      <View style={[styles.container, { backgroundColor: theme.backgroundColor }]}>
        <ActivityIndicator size="small" color={theme.primaryColor} />
      </View>
    );
  }

  return <Redirect href={isAuthenticated ? '/(tabs)' : '/auth'} />;
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
});
