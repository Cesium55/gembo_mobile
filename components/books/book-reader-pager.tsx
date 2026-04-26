import { useEffect, useRef, useState } from 'react';
import { FlatList, NativeScrollEvent, NativeSyntheticEvent, StyleSheet, View } from 'react-native';

import { BookReaderPageContent } from '@/components/books/book-reader-page-content';
import { BookReaderSearchResultsModal } from '@/components/books/book-reader-search-results-modal';
import { ReaderTheme } from '@/constants/colors';
import { ReaderPage } from '@/hooks/books/use-book-pagination';

type BookReaderPagerProps = {
  pages: ReaderPage[];
  currentPage: number;
  onPageChange: (page: number) => void;
  pageWidth: number;
  fontFamily?: string;
  fontSize: number;
  lineHeight: number;
  theme: ReaderTheme;
};

export function BookReaderPager({
  pages,
  currentPage,
  onPageChange,
  pageWidth,
  fontFamily,
  fontSize,
  lineHeight,
  theme,
}: BookReaderPagerProps) {
  const listRef = useRef<FlatList<ReaderPage>>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const pagerWidth = Math.max(pageWidth, 1);

  useEffect(() => {
    if (!pages.length) {
      return;
    }

    listRef.current?.scrollToIndex({
      animated: false,
      index: Math.min(currentPage, pages.length - 1),
    });
  }, [currentPage, pages.length]);

  const handleMomentumEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const nextPage = Math.round(event.nativeEvent.contentOffset.x / pagerWidth);
    onPageChange(nextPage);
  };

  const handleScrollToIndexFailed = () => {
    listRef.current?.scrollToOffset({
      animated: false,
      offset: pagerWidth * currentPage,
    });
  };

  const handleSearchSelection = (value: string) => {
    const normalizedQuery = value.trim();
    if (!normalizedQuery) {
      return;
    }

    setSearchQuery(normalizedQuery);
    setIsSearchOpen(true);
  };

  return (
    <View style={styles.container}>
      <FlatList
        ref={listRef}
        data={pages}
        key={`${pages.length}-${pagerWidth}-${fontSize}-${lineHeight}-${fontFamily ?? 'default'}`}
        horizontal
        pagingEnabled
        initialScrollIndex={Math.min(currentPage, Math.max(pages.length - 1, 0))}
        getItemLayout={(_, index) => ({
          index,
          length: pagerWidth,
          offset: pagerWidth * index,
        })}
        showsHorizontalScrollIndicator={false}
        keyExtractor={(_, index) => String(index)}
        onMomentumScrollEnd={handleMomentumEnd}
        onScrollToIndexFailed={handleScrollToIndexFailed}
        renderItem={({ item }) => (
          <BookReaderPageContent
            content={item.content}
            fontFamily={fontFamily}
            fontSize={fontSize}
            lineHeight={lineHeight}
            theme={theme}
            title={item.title}
            width={pagerWidth}
            onSearchSelection={handleSearchSelection}
          />
        )}
      />
      <BookReaderSearchResultsModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        query={searchQuery}
        theme={theme}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
