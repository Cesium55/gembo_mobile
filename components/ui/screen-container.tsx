import { PropsWithChildren } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { Edge, SafeAreaView } from 'react-native-safe-area-context';

import { AppTheme } from '@/constants/colors';
import { useAppTheme } from '@/providers/theme-provider';

const DEFAULT_SAFE_AREA_EDGES: readonly Edge[] = ['top', 'left', 'right'];

type ScreenContainerProps = PropsWithChildren<{
  safeAreaEdges?: readonly Edge[];
  contentStyle?: StyleProp<ViewStyle>;
  themeOverride?: AppTheme;
}>;

export function ScreenContainer({
  children,
  safeAreaEdges = DEFAULT_SAFE_AREA_EDGES,
  contentStyle,
  themeOverride,
}: ScreenContainerProps) {
  const { theme: appTheme } = useAppTheme();
  const theme = themeOverride ?? appTheme;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.backgroundColor }]} edges={safeAreaEdges}>
      <View style={[styles.container, contentStyle]}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
});
