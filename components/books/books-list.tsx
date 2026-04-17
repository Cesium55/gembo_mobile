import { ActivityIndicator, FlatList, Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { BookListItem } from '@/components/books/book-list-item';
import { Book } from '@/hooks/use-books-api';
import { useAppTheme } from '@/providers/theme-provider';

type BooksListProps = {
  books: Book[];
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
  onBookPress: (book: Book) => void;
};

export function BooksList({ books, isLoading, error, onRetry, onBookPress }: BooksListProps) {
  const { theme } = useAppTheme();

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="small" color={theme.primaryColor} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <AppText style={{ color: '#EF4444', textAlign: 'center' }}>{error}</AppText>
        <Pressable onPress={onRetry} style={[styles.retryButton, { borderColor: theme.borderColor, backgroundColor: theme.cardColor }]}>
          <AppText style={{ color: theme.textColor }}>Повторить</AppText>
        </Pressable>
      </View>
    );
  }

  if (!books.length) {
    return (
      <View style={styles.centered}>
        <AppText style={{ color: theme.mutedTextColor, textAlign: 'center' }}>Книг пока нет</AppText>
      </View>
    );
  }

  return (
    <FlatList
      data={books}
      keyExtractor={(item) => String(item.id)}
      renderItem={({ item }) => <BookListItem book={item} onPress={onBookPress} />}
      contentContainerStyle={styles.listContent}
      ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
      showsVerticalScrollIndicator={false}
    />
  );
}

const styles = StyleSheet.create({
  centered: {
    alignItems: 'center',
    flex: 1,
    gap: 10,
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  listContent: {
    paddingBottom: 16,
  },
  retryButton: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
});
