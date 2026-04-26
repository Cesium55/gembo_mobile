import { Stack, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, LayoutChangeEvent, Pressable, StyleSheet, View } from 'react-native';

import { BookReaderChaptersModal } from '@/components/books/book-reader-chapters-modal';
import { BookReaderHeaderPageButton, BookReaderHeaderSettingsButton } from '@/components/books/book-reader-header-actions';
import { BookReaderPager } from '@/components/books/book-reader-pager';
import { BookReaderSettingsModal } from '@/components/books/book-reader-settings-modal';
import { AppText } from '@/components/ui/app-text';
import { ReaderThemes } from '@/constants/colors';
import { ScreenContainer } from '@/components/ui/screen-container';
import { useBookDetails } from '@/hooks/books/use-book-details';
import { useBookPageCache } from '@/hooks/books/use-book-page-cache';
import { useBookPagination } from '@/hooks/books/use-book-pagination';
import { useReaderPreferences } from '@/providers/reader-preferences-provider';

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

function getCurrentChapterIndex(currentPage: number, chapterStarts: number[]) {
  if (!chapterStarts.length) {
    return -1;
  }

  for (let index = chapterStarts.length - 1; index >= 0; index -= 1) {
    if (currentPage >= chapterStarts[index]) {
      return index;
    }
  }

  return 0;
}

export default function BookReaderScreen() {
  const { fontFamily, fontSize, readerThemeName, setFontFamily, setFontSize, setReaderThemeName } = useReaderPreferences();
  const params = useLocalSearchParams<{ bookId?: string }>();
  const [chaptersModalOpen, setChaptersModalOpen] = useState(false);
  const [readerSettingsOpen, setReaderSettingsOpen] = useState(false);
  const [readerLayout, setReaderLayout] = useState({ width: 0, height: 0 });
  const readerTheme = ReaderThemes[readerThemeName];

  const bookId = parseBookId(params.bookId);
  const { book, isLoading, error, reload } = useBookDetails(bookId);
  const { pages, chapters, typography } = useBookPagination(book?.chapters ?? [], {
    fontFamily,
    fontSize,
    pageWidth: readerLayout.width,
    pageHeight: readerLayout.height,
  });
  const { currentPage, isRestoring, setCurrentPage } = useBookPageCache(book?.id ?? null, pages.length);
  const isReaderReady = readerLayout.width > 0 && readerLayout.height > 0 && (pages.length > 0 || !book?.chapters.length);
  const previousFontSizeRef = useRef(fontSize);
  const previousPageCountRef = useRef(pages.length);
  const pendingPageRatioRef = useRef<number | null>(null);

  const currentChapterIndex = useMemo(
    () => getCurrentChapterIndex(currentPage, chapters.map((chapter) => chapter.startPage)),
    [chapters, currentPage],
  );

  useEffect(() => {
    console.log('[BookReaderScreen] mount');

    return () => {
      console.log('[BookReaderScreen] unmount');
    };
  }, []);

  useEffect(() => {
    console.log('[BookReaderScreen] route-param-change', {
      rawBookId: params.bookId,
      bookId,
    });
  }, [bookId, params.bookId]);

  useEffect(() => {
    console.log('[BookReaderScreen] open', {
      rawBookId: params.bookId,
      bookId,
      readerThemeName,
      fontFamily,
      fontSize,
    });
  }, [bookId, fontFamily, fontSize, params.bookId, readerThemeName]);

  useEffect(() => {
    console.log('[BookReaderScreen] state', {
      bookId,
      isLoading,
      isRestoring,
      hasBook: Boolean(book),
      error,
      pageCount: pages.length,
      chapterCount: chapters.length,
      currentPage,
      layout: readerLayout,
      isReaderReady,
    });
  }, [
    book,
    bookId,
    chapters.length,
    currentPage,
    error,
    isLoading,
    isReaderReady,
    isRestoring,
    pages.length,
    readerLayout,
  ]);

  const handleSelectChapter = (startPage: number) => {
    console.log('[BookReaderScreen] select-chapter', { bookId, startPage });
    setCurrentPage(startPage);
    setChaptersModalOpen(false);
  };
  const handleReaderLayout = useCallback((event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    console.log('[BookReaderScreen] layout', { bookId, width, height });
    setReaderLayout((previous) =>
      previous.width === width && previous.height === height ? previous : { width, height },
    );
  }, [bookId]);

  useEffect(() => {
    if (previousFontSizeRef.current === fontSize) {
      return;
    }

    const previousPageCount = previousPageCountRef.current;
    pendingPageRatioRef.current = previousPageCount > 1 ? currentPage / (previousPageCount - 1) : 0;
    previousFontSizeRef.current = fontSize;
  }, [currentPage, fontSize]);

  useEffect(() => {
    if (pendingPageRatioRef.current !== null && pages.length > 0) {
      const nextPage = pages.length > 1 ? Math.round(pendingPageRatioRef.current * (pages.length - 1)) : 0;
      pendingPageRatioRef.current = null;

      if (nextPage !== currentPage) {
        console.log('[BookReaderScreen] remap-page-after-font-change', {
          bookId,
          currentPage,
          nextPage,
          pageCount: pages.length,
        });
        setCurrentPage(nextPage);
      }
    }

    previousPageCountRef.current = pages.length;
  }, [bookId, currentPage, pages.length, setCurrentPage]);

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: '',
          headerBackTitle: 'Назад',
          headerTitleAlign: 'center',
          headerStyle: { backgroundColor: readerTheme.cardColor },
          headerShadowVisible: false,
          headerTintColor: readerTheme.textColor,
          headerTitleStyle: { color: readerTheme.textColor },
          headerTitle: () => (
            <View style={styles.headerTitleWrap}>
              <BookReaderHeaderPageButton
                currentPage={currentPage}
                totalPages={pages.length}
                onPress={() => setChaptersModalOpen(true)}
                theme={readerTheme}
              />
            </View>
          ),
          headerRight: () => <BookReaderHeaderSettingsButton onPress={() => setReaderSettingsOpen(true)} theme={readerTheme} />,
        }}
      />

      <ScreenContainer safeAreaEdges={['left', 'right']} contentStyle={styles.readerContent} themeOverride={readerTheme}>
        {isLoading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="small" color={readerTheme.primaryColor} />
          </View>
        ) : error ? (
          <View style={styles.centered}>
            <AppText style={{ color: '#EF4444', textAlign: 'center' }}>{error}</AppText>
            <Pressable
              onPress={reload}
              style={[styles.retryButton, { borderColor: readerTheme.borderColor, backgroundColor: readerTheme.cardColor }]}>
              <AppText style={{ color: readerTheme.textColor }}>Повторить</AppText>
            </Pressable>
          </View>
        ) : book && isRestoring ? (
          <View style={styles.centered}>
            <ActivityIndicator size="small" color={readerTheme.primaryColor} />
          </View>
        ) : book ? (
          <View style={styles.readerStage} onLayout={handleReaderLayout}>
            {isReaderReady ? (
              <BookReaderPager
                pages={pages}
                currentPage={currentPage}
                onPageChange={setCurrentPage}
                pageWidth={readerLayout.width}
                fontFamily={typography.fontFamily}
                fontSize={typography.fontSize}
                lineHeight={typography.lineHeight}
                theme={readerTheme}
              />
            ) : (
              <View style={styles.centered}>
                <ActivityIndicator size="small" color={readerTheme.primaryColor} />
              </View>
            )}
          </View>
        ) : (
          <View style={styles.centered}>
            <AppText style={{ color: readerTheme.mutedTextColor }}>Книга не найдена</AppText>
          </View>
        )}
      </ScreenContainer>

      <BookReaderChaptersModal
        isOpen={chaptersModalOpen}
        chapters={chapters}
        currentChapterIndex={currentChapterIndex}
        onClose={() => setChaptersModalOpen(false)}
        onSelectChapter={handleSelectChapter}
        theme={readerTheme}
      />

      <BookReaderSettingsModal
        isOpen={readerSettingsOpen}
        fontFamily={fontFamily}
        fontSize={fontSize}
        readerThemeName={readerThemeName}
        readerTheme={readerTheme}
        onClose={() => setReaderSettingsOpen(false)}
        onFontFamilyChange={setFontFamily}
        onFontSizeChange={setFontSize}
        onReaderThemeChange={setReaderThemeName}
      />
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
  headerTitleWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  readerContent: {
    alignItems: 'center',
    paddingTop: 0,
  },
  readerStage: {
    height: '94%',
    width: '100%',
  },
  retryButton: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
});
