import { useCallback, useMemo, useState } from 'react';
import { Clipboard } from 'react-native';

type ReaderSelectionAnchor = {
  x: number;
  y: number;
};

export function useBookReaderSelection() {
  const [selectedText, setSelectedText] = useState('');
  const [selectionResetKey, setSelectionResetKey] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [selectionAnchor, setSelectionAnchor] = useState<ReaderSelectionAnchor | null>(null);

  const normalizedSelection = selectedText.trim();
  const hasSelection = normalizedSelection.length > 0;

  const clearSelection = useCallback(() => {
    setSelectedText('');
    setSelectionAnchor(null);
    setSelectionResetKey((current) => current + 1);
  }, []);

  const updateSelectedText = useCallback((value: string, anchor?: ReaderSelectionAnchor | null) => {
    setSelectedText(value);
    setSelectionAnchor(anchor ?? null);
  }, []);

  const handleCopySelection = useCallback(() => {
    if (!hasSelection) {
      return;
    }

    Clipboard.setString(selectedText);
    clearSelection();
  }, [clearSelection, hasSelection, selectedText]);

  const handleSearchSelection = useCallback(() => {
    if (!hasSelection) {
      return;
    }

    setSearchQuery(normalizedSelection);
    setIsSearchOpen(true);
    clearSelection();
  }, [clearSelection, hasSelection, normalizedSelection]);

  const closeSearch = useCallback(() => {
    setIsSearchOpen(false);
  }, []);

  return useMemo(
    () => ({
      clearSelection,
      closeSearch,
      handleCopySelection,
      handleSearchSelection,
      hasSelection,
      isSearchOpen,
      searchQuery,
      selectionAnchor,
      selectedText,
      selectionResetKey,
      updateSelectedText,
    }),
    [
      clearSelection,
      closeSearch,
      handleCopySelection,
      handleSearchSelection,
      hasSelection,
      isSearchOpen,
      searchQuery,
      selectionAnchor,
      selectedText,
      selectionResetKey,
      updateSelectedText,
    ],
  );
}
