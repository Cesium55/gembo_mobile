import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { useAppTheme } from '@/providers/theme-provider';

export function HomeHero() {
  const { theme } = useAppTheme();

  return (
    <View style={[styles.card, { backgroundColor: theme.cardColor, borderColor: theme.borderColor }]}>
      <AppText variant="title">English Journey</AppText>
      <AppText style={styles.description}>
        Приложение для изучения английского: слова, тренировки, повторения и ежедневный прогресс.
      </AppText>
      <AppText variant="caption">Минималистичный стартовый экран для дальнейшей разработки.</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    borderWidth: 1,
    gap: 12,
    padding: 20,
  },
  description: {
    maxWidth: 560,
  },
});
