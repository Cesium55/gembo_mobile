import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet } from 'react-native';

import { ReaderTheme } from '@/constants/colors';
import { AppText } from '@/components/ui/app-text';

type BookReaderHeaderPageButtonProps = {
  currentPage: number;
  totalPages: number;
  onPress: () => void;
  theme: ReaderTheme;
};

export function BookReaderHeaderPageButton({ currentPage, totalPages, onPress, theme }: BookReaderHeaderPageButtonProps) {
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
  theme: ReaderTheme;
};

export function BookReaderHeaderSettingsButton({ onPress, theme }: BookReaderHeaderSettingsButtonProps) {
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
