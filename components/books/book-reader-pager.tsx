import { FlatList, NativeScrollEvent, NativeSyntheticEvent, StyleSheet, View, useWindowDimensions } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { useAppTheme } from '@/providers/theme-provider';

type BookReaderPagerProps = {
  pages: string[];
  currentPage: number;
  initialPage: number;
  onPageChange: (page: number) => void;
};

export function BookReaderPager({ pages, currentPage, initialPage, onPageChange }: BookReaderPagerProps) {
  const { width: screenWidth } = useWindowDimensions();
  const { theme } = useAppTheme();

  const pagerWidth = Math.max(screenWidth - 40, 1);

  const handleMomentumEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const nextPage = Math.round(event.nativeEvent.contentOffset.x / pagerWidth);
    onPageChange(nextPage);
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={pages}
        key={`${pages.length}-${pagerWidth}`}
        horizontal
        pagingEnabled
        initialScrollIndex={initialPage}
        getItemLayout={(_, index) => ({
          index,
          length: pagerWidth,
          offset: pagerWidth * index,
        })}
        showsHorizontalScrollIndicator={false}
        keyExtractor={(_, index) => String(index)}
        onMomentumScrollEnd={handleMomentumEnd}
        renderItem={({ item }) => (
          <View style={[styles.page, { width: pagerWidth }]}>
            <AppText style={[styles.pageText, { color: theme.textColor }]}>{item}</AppText>
          </View>
        )}
      />
      <View style={[styles.pageIndicator, { backgroundColor: theme.cardColor, borderColor: theme.borderColor }]}>
        <AppText style={{ color: theme.textColor }}>{currentPage + 1}/{pages.length}</AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  page: {
    paddingVertical: 12,
    paddingRight: 2,
  },
  pageText: {
    fontSize: 18,
    lineHeight: 30,
  },
  pageIndicator: {
    alignSelf: 'center',
    borderRadius: 999,
    borderWidth: 1,
    marginBottom: 12,
    marginTop: 8,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
});
