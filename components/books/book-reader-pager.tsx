import { useEffect, useRef } from 'react';
import { FlatList, NativeScrollEvent, NativeSyntheticEvent, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { ReaderPage } from '@/hooks/books/use-book-pagination';
import { useAppTheme } from '@/providers/theme-provider';

type BookReaderPagerProps = {
  pages: ReaderPage[];
  currentPage: number;
  onPageChange: (page: number) => void;
  pageWidth: number;
  fontFamily?: string;
  fontSize: number;
  lineHeight: number;
};

export function BookReaderPager({
  pages,
  currentPage,
  onPageChange,
  pageWidth,
  fontFamily,
  fontSize,
  lineHeight,
}: BookReaderPagerProps) {
  const { theme } = useAppTheme();
  const listRef = useRef<FlatList<ReaderPage>>(null);

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
          <View style={[styles.page, { width: pagerWidth }]}>
            {item.title ? (
              <AppText
                style={[
                  styles.chapterTitle,
                  {
                    color: theme.textColor,
                    fontFamily,
                    fontSize,
                    lineHeight,
                  },
                ]}>
                {item.title}
              </AppText>
            ) : null}
            <AppText
              style={[
                styles.pageText,
                {
                  color: theme.textColor,
                  fontFamily,
                  fontSize,
                  lineHeight,
                },
              ]}>
              {item.content}
            </AppText>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  chapterTitle: {
    fontWeight: '800',
    marginBottom: 16,
    textAlign: 'center',
  },
  container: {
    flex: 1,
  },
  page: {
    flex: 1,
    paddingRight: 2,
    paddingTop: 12,
  },
  pageText: {
    includeFontPadding: true,
    paddingBottom: 8,
  },
});
