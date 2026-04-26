import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { BooksList } from '@/components/books/books-list';
import { AppText } from '@/components/ui/app-text';
import { ScreenContainer } from '@/components/ui/screen-container';
import { Book } from '@/hooks/use-books-api';
import { useBooksList } from '@/hooks/books/use-books-list';
import { useAppTheme } from '@/providers/theme-provider';

export default function BooksScreen() {
  const { theme } = useAppTheme();
  const router = useRouter();
  const { books, error, isLoading, reload } = useBooksList();

  const handleOpenBook = (book: Book) => {
    console.log('[BooksScreen] navigate:book', {
      bookId: book.id,
      title: book.title,
      author: book.author,
    });
    router.push({
      pathname: '/books/[bookId]',
      params: { bookId: String(book.id) },
    });
  };

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <AppText style={[styles.title, { color: theme.textColor }]}>Books</AppText>
        <AppText style={{ color: theme.mutedTextColor }}>Выберите книгу для чтения</AppText>
      </View>
      <BooksList books={books} error={error} isLoading={isLoading} onRetry={reload} onBookPress={handleOpenBook} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: 2,
    marginBottom: 14,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
  },
});
