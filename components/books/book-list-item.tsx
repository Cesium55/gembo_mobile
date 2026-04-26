import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { AppText } from '@/components/ui/app-text';
import { Book } from '@/hooks/use-books-api';
import { useAppTheme } from '@/providers/theme-provider';

type BookListItemProps = {
  book: Book;
  onPress: (book: Book) => void;
};

export function BookListItem({ book, onPress }: BookListItemProps) {
  const { theme } = useAppTheme();

  return (
    <Pressable
      onPress={() => {
        console.log('[BookListItem] press', {
          bookId: book.id,
          title: book.title,
          author: book.author,
        });
        onPress(book);
      }}
      style={({ pressed }) => [
        styles.container,
        {
          backgroundColor: theme.cardColor,
          borderColor: theme.borderColor,
          opacity: pressed ? 0.85 : 1,
        },
      ]}>
      <View style={styles.content}>
        <AppText style={[styles.title, { color: theme.textColor }]} numberOfLines={2}>
          {book.title}
        </AppText>
        <AppText style={{ color: theme.mutedTextColor }} numberOfLines={1}>
          {book.author}
        </AppText>
      </View>
      <Ionicons name="chevron-forward" size={18} color={theme.mutedTextColor} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  content: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    lineHeight: 24,
  },
});
