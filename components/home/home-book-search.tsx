import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { SearchBooksResponse, useBookSearch } from '@/hooks/use-book-search';
import { useAppTheme } from '@/providers/theme-provider';
import { AppBottomModal } from '../ui/app-bottom-modal';
import { AppText } from '../ui/app-text';
import { HighlightedSearchText } from './highlighted-search-text';

export function HomeBookSearch() {
  const { theme } = useAppTheme();
  const { searchBooks } = useBookSearch();
  const [query, setQuery] = useState('');
  const [isResultsOpen, setIsResultsOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [hits, setHits] = useState<SearchBooksResponse['hits']['hits']>([]);

  const totalHits = useMemo(() => hits.length, [hits.length]);

  const handleSearch = useCallback(async () => {
    const normalizedQuery = query.trim();
    if (!normalizedQuery) {
      setHasSearched(false);
      setHits([]);
      setSearchError('Введите поисковый запрос');
      setIsResultsOpen(true);
      return;
    }

    setIsResultsOpen(true);
    setIsSearching(true);
    setSearchError(null);
    setHasSearched(true);

    try {
      const response = await searchBooks({
        query: normalizedQuery,
        size: 20,
        fragment_size: 130,
        number_of_fragments: 3,
      });
      setHits(response.hits.hits);
    } catch (unknownError) {
      const message = unknownError instanceof Error ? unknownError.message : 'Не удалось выполнить поиск';
      setHits([]);
      setSearchError(message);
    } finally {
      setIsSearching(false);
    }
  }, [query, searchBooks]);

  return (
    <>
      <View style={[styles.searchRow, { backgroundColor: theme.cardColor, borderColor: theme.borderColor }]}>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Поиск по книгам"
          placeholderTextColor={theme.mutedTextColor}
          style={[styles.searchInput, { color: theme.textColor }]}
          returnKeyType="search"
          onSubmitEditing={handleSearch}
        />
        <Pressable style={[styles.searchButton, { backgroundColor: theme.primaryColor }]} onPress={handleSearch}>
          <AppText style={[styles.searchButtonText, { color: theme.onPrimaryColor }]}>Найти</AppText>
        </Pressable>
      </View>

      <AppBottomModal isOpen={isResultsOpen} onClose={() => setIsResultsOpen(false)} title="Результаты поиска" scrollable>
        {isSearching ? (
          <View style={styles.modalCenter}>
            <ActivityIndicator size="small" color={theme.primaryColor} />
          </View>
        ) : searchError ? (
          <View style={styles.modalCenter}>
            <AppText style={styles.errorText}>{searchError}</AppText>
          </View>
        ) : !hasSearched ? (
          <View style={styles.modalCenter}>
            <AppText style={{ color: theme.mutedTextColor }}>Введите запрос и нажмите «Найти»</AppText>
          </View>
        ) : !hits.length ? (
          <View style={styles.modalCenter}>
            <AppText style={{ color: theme.mutedTextColor }}>Ничего не найдено</AppText>
          </View>
        ) : (
          <View style={styles.resultsWrap}>
            <AppText style={{ color: theme.mutedTextColor }}>Найдено: {totalHits}</AppText>
            {hits.map((hit) => {
              const title = hit.highlight?.title?.[0] ?? hit._source.title;
              const author = hit.highlight?.author?.[0] ?? hit._source.author;
              const textFragments = hit.highlight?.text ?? [];

              return (
                <View key={hit._id} style={[styles.resultCard, { backgroundColor: theme.backgroundColor, borderColor: theme.borderColor }]}>
                  <HighlightedSearchText value={title} color={theme.textColor} style={[styles.resultTitle, { color: theme.textColor }]} />
                  <HighlightedSearchText value={author} color={theme.mutedTextColor} style={[styles.resultAuthor, { color: theme.mutedTextColor }]} />
                  {textFragments.map((fragment, index) => (
                    <HighlightedSearchText
                      key={`${hit._id}-fragment-${index}`}
                      value={fragment}
                      color={theme.textColor}
                      style={[styles.resultSnippet, { color: theme.textColor }]}
                    />
                  ))}
                </View>
              );
            })}
          </View>
        )}
      </AppBottomModal>
    </>
  );
}

const styles = StyleSheet.create({
  searchRow: {
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
    padding: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  searchButton: {
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  searchButtonText: {
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 18,
  },
  modalCenter: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
  },
  errorText: {
    color: '#EF4444',
    textAlign: 'center',
  },
  resultsWrap: {
    gap: 10,
  },
  resultCard: {
    borderRadius: 14,
    borderWidth: 1,
    gap: 8,
    padding: 12,
  },
  resultTitle: {
    fontSize: 17,
    fontWeight: '800',
    lineHeight: 22,
  },
  resultAuthor: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 19,
  },
  resultSnippet: {
    fontSize: 14,
    lineHeight: 21,
  },
});
