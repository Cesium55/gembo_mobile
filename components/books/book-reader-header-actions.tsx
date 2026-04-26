import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { useAppTheme } from '@/providers/theme-provider';

type BookReaderHeaderPageButtonProps = {
  currentPage: number;
  totalPages: number;
  onPress: () => void;
};

export function BookReaderHeaderPageButton({ currentPage, totalPages, onPress }: BookReaderHeaderPageButtonProps) {
  const { theme } = useAppTheme();

  return (
    <Pressable onPress={onPress} style={[styles.pageButton, { backgroundColor: theme.cardColor, borderColor: theme.borderColor }]}>
      <AppText style={{ color: theme.textColor, fontWeight: '700' }}>
        {totalPages ? currentPage + 1 : 0}/{totalPages}
      </AppText>
    </Pressable>
  );
}

type BookReaderHeaderSettingsButtonProps = {
  onPress: () => void;
};

export function BookReaderHeaderSettingsButton({ onPress }: BookReaderHeaderSettingsButtonProps) {
  const { theme } = useAppTheme();

  return (
    <Pressable onPress={onPress} style={[styles.iconButton, { backgroundColor: theme.cardColor, borderColor: theme.borderColor }]}>
      <Ionicons name="options-outline" size={18} color={theme.textColor} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  iconButton: {
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  pageButton: {
    alignSelf: 'center',
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: 1,
    justifyContent: 'center',
    minWidth: 78,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
});
