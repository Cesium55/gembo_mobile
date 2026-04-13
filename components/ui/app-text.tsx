import { PropsWithChildren } from 'react';
import { StyleProp, StyleSheet, Text, TextStyle } from 'react-native';

import { useAppTheme } from '@/providers/theme-provider';

type AppTextProps = PropsWithChildren<{
  variant?: 'title' | 'body' | 'caption';
  style?: StyleProp<TextStyle>;
}>;

export function AppText({ children, style, variant = 'body' }: AppTextProps) {
  const { theme } = useAppTheme();

  return <Text style={[styles.base, styles[variant], { color: theme.textColor }, style]}>{children}</Text>;
}

const styles = StyleSheet.create({
  base: {
    fontSize: 16,
    lineHeight: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 34,
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
  },
  caption: {
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.8,
  },
});
