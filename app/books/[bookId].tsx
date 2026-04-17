import { Stack, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { BookReaderPager } from '@/components/books/book-reader-pager';
import { AppText } from '@/components/ui/app-text';
import { ScreenContainer } from '@/components/ui/screen-container';
import { useBookDetails } from '@/hooks/books/use-book-details';
import { useBookPageCache } from '@/hooks/books/use-book-page-cache';
import { useBookPagination } from '@/hooks/books/use-book-pagination';
import { useAppTheme } from '@/providers/theme-provider';

function parseBookId(value?: string | string[]) {
  if (Array.isArray(value)) {
    return parseBookId(value[0]);
  }

  if (!value) {
    return null;
  }

  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null;
  }

  return parsed;
}

export default function BookReaderScreen() {
  const { theme } = useAppTheme();
  const params = useLocalSearchParams<{ bookId?: string }>();

  const bookId = parseBookId(params.bookId);
  const { book, isLoading, error, reload } = useBookDetails(bookId);
  const pages = useBookPagination(book?.content ?? '');
  const { currentPage, isRestoring, setCurrentPage } = useBookPageCache(book?.id ?? null, pages.length);

  const title = book?.title ?? 'Книга';

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title,
          headerBackTitle: 'Назад',
        }}
      />

      <ScreenContainer safeAreaEdges={['left', 'right']} contentStyle={styles.readerContent}>
        {isLoading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="small" color={theme.primaryColor} />
          </View>
        ) : error ? (
          <View style={styles.centered}>
            <AppText style={{ color: '#EF4444', textAlign: 'center' }}>{error}</AppText>
            <Pressable onPress={reload} style={[styles.retryButton, { borderColor: theme.borderColor, backgroundColor: theme.cardColor }]}>
              <AppText style={{ color: theme.textColor }}>Повторить</AppText>
            </Pressable>
          </View>
        ) : book && isRestoring ? (
          <View style={styles.centered}>
            <ActivityIndicator size="small" color={theme.primaryColor} />
          </View>
        ) : book ? (
          <>
            <BookReaderPager pages={pages} currentPage={currentPage} initialPage={currentPage} onPageChange={setCurrentPage} />
          </>
        ) : (
          <View style={styles.centered}>
            <AppText style={{ color: theme.mutedTextColor }}>Книга не найдена</AppText>
          </View>
        )}
      </ScreenContainer>
    </>
  );
}

const styles = StyleSheet.create({
  centered: {
    alignItems: 'center',
    flex: 1,
    gap: 10,
    justifyContent: 'center',
  },
  retryButton: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  readerContent: {
    paddingTop: 0,
  },
});
