import { StyleSheet, Switch, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { ScreenContainer } from '@/components/ui/screen-container';
import { useAppTheme } from '@/providers/theme-provider';

export default function SettingsScreen() {
  const { isDark, theme, toggleTheme } = useAppTheme();

  return (
    <ScreenContainer>
      <View style={[styles.row, { backgroundColor: theme.cardColor, borderColor: theme.borderColor }]}>
        <AppText variant="body">Темная тема</AppText>
        <Switch value={isDark} onValueChange={toggleTheme} />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
});
