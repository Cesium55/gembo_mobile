import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { ReaderTheme } from '@/constants/colors';
import { SearchBooksResponse, useBookSearch } from '@/hooks/use-book-search';
import { HighlightedSearchText } from '@/components/home/highlighted-search-text';
import { AppBottomModal } from '@/components/ui/app-bottom-modal';
import { AppText } from '@/components/ui/app-text';

type BookReaderSearchResultsModalProps = {
  isOpen: boolean;
  onClose: () => void;
  query: string;
  theme: ReaderTheme;
};

export function BookReaderSearchResultsModal({
  isOpen,
  onClose,
  query,
  theme,
}: BookReaderSearchResultsModalProps) {
  const { searchBooks } = useBookSearch();
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [hits, setHits] = useState<SearchBooksResponse['hits']['hits']>([]);

  useEffect(() => {
    let isMounted = true;

    const runSearch = async () => {
      const normalizedQuery = query.trim();
      if (!isOpen || !normalizedQuery) {
        if (isMounted) {
          setHits([]);
          setSearchError(null);
          setIsSearching(false);
        }
        return;
      }

      setIsSearching(true);
      setSearchError(null);

      try {
        const response = await searchBooks({
          query: normalizedQuery,
          size: 20,
          fragment_size: 130,
          number_of_fragments: 3,
        });

        if (isMounted) {
          setHits(response.hits.hits);
        }
      } catch (unknownError) {
        if (isMounted) {
          const message = unknownError instanceof Error ? unknownError.message : 'Не удалось выполнить поиск';
          setHits([]);
          setSearchError(message);
        }
      } finally {
        if (isMounted) {
          setIsSearching(false);
        }
      }
    };

    void runSearch();

    return () => {
      isMounted = false;
    };
  }, [isOpen, query, searchBooks]);

  const totalHits = useMemo(() => hits.length, [hits.length]);

  return (
    <AppBottomModal
      isOpen={isOpen}
      onClose={onClose}
      title="Поиск по фрагменту"
      scrollable
      themeOverride={theme}>
      <View style={styles.resultsWrap}>
        <View style={[styles.queryCard, { backgroundColor: theme.backgroundColor, borderColor: theme.borderColor }]}>
          <AppText style={{ color: theme.mutedTextColor }}>Запрос</AppText>
          <AppText style={{ color: theme.textColor, fontWeight: '700' }}>{query.trim() || '—'}</AppText>
        </View>

        {isSearching ? (
          <View style={styles.modalCenter}>
            <ActivityIndicator size="small" color={theme.primaryColor} />
          </View>
        ) : searchError ? (
          <View style={styles.modalCenter}>
            <AppText style={styles.errorText}>{searchError}</AppText>
          </View>
        ) : !hits.length ? (
          <View style={styles.modalCenter}>
            <AppText style={{ color: theme.mutedTextColor }}>Ничего не найдено</AppText>
          </View>
        ) : (
          <>
            <AppText style={{ color: theme.mutedTextColor }}>Найдено: {totalHits}</AppText>
            {hits.map((hit) => {
              const title = hit.highlight?.title?.[0] ?? hit._source.title;
              const author = hit.highlight?.author?.[0] ?? hit._source.author;
              const textFragments = hit.highlight?.text ?? [];

              return (
                <View
                  key={hit._id}
                  style={[styles.resultCard, { backgroundColor: theme.backgroundColor, borderColor: theme.borderColor }]}>
                  <HighlightedSearchText value={title} color={theme.textColor} style={[styles.resultTitle, { color: theme.textColor }]} />
                  <HighlightedSearchText
                    value={author}
                    color={theme.mutedTextColor}
                    style={[styles.resultAuthor, { color: theme.mutedTextColor }]}
                  />
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
          </>
        )}
      </View>
    </AppBottomModal>
  );
}

const styles = StyleSheet.create({
  errorText: {
    color: '#EF4444',
    textAlign: 'center',
  },
  modalCenter: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
  },
  queryCard: {
    borderRadius: 14,
    borderWidth: 1,
    gap: 6,
    padding: 12,
  },
  resultAuthor: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 19,
  },
  resultCard: {
    borderRadius: 14,
    borderWidth: 1,
    gap: 8,
    padding: 12,
  },
  resultSnippet: {
    fontSize: 14,
    lineHeight: 21,
  },
  resultTitle: {
    fontSize: 17,
    fontWeight: '800',
    lineHeight: 22,
  },
  resultsWrap: {
    gap: 10,
  },
});
