import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppBottomModal } from '@/components/ui/app-bottom-modal';
import { AppText } from '@/components/ui/app-text';
import { ReaderTheme } from '@/constants/colors';
import { PaginatedChapter } from '@/hooks/books/use-book-pagination';

type BookReaderChaptersModalProps = {
  isOpen: boolean;
  chapters: PaginatedChapter[];
  currentChapterIndex: number;
  onClose: () => void;
  onSelectChapter: (startPage: number) => void;
  theme: ReaderTheme;
};

export function BookReaderChaptersModal({
  isOpen,
  chapters,
  currentChapterIndex,
  onClose,
  onSelectChapter,
  theme,
}: BookReaderChaptersModalProps) {
  return (
    <AppBottomModal isOpen={isOpen} onClose={onClose} title="Главы" scrollable themeOverride={theme}>
      <View style={styles.modalList}>
        {chapters.length ? (
          chapters.map((chapter, index) => {
            const isActive = index === currentChapterIndex;

            return (
              <Pressable
                key={chapter.chapterId}
                onPress={() => onSelectChapter(chapter.startPage)}
                style={[
                  styles.modalItem,
                  {
                    backgroundColor: isActive ? theme.primaryColor : theme.backgroundColor,
                    borderColor: isActive ? theme.primaryColor : theme.borderColor,
                  },
                ]}>
                <View style={styles.modalItemBody}>
                  <AppText style={{ color: isActive ? theme.onPrimaryColor : theme.textColor, fontWeight: '700' }}>
                    {chapter.title}
                  </AppText>
                  <AppText style={{ color: isActive ? theme.onPrimaryColor : theme.mutedTextColor }}>
                    Страница {chapter.startPage + 1}
                  </AppText>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color={isActive ? theme.onPrimaryColor : theme.mutedTextColor}
                />
              </Pressable>
            );
          })
        ) : (
          <View style={styles.modalCenter}>
            <AppText style={{ color: theme.mutedTextColor }}>Главы не найдены</AppText>
          </View>
        )}
      </View>
    </AppBottomModal>
  );
}

const styles = StyleSheet.create({
  modalCenter: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  modalItem: {
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  modalItemBody: {
    flex: 1,
    gap: 4,
  },
  modalList: {
    gap: 10,
  },
});
