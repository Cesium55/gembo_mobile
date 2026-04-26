import { Pressable, StyleSheet, View } from 'react-native';

import { ReaderTheme } from '@/constants/colors';
import { AppText } from '@/components/ui/app-text';

type BookReaderSelectionMenuProps = {
  isVisible: boolean;
  theme: ReaderTheme;
  anchor: {
    x: number;
    y: number;
  } | null;
  containerWidth: number;
  onCopy: () => void;
  onSearch: () => void;
};

const MENU_ACTIONS = [
  { key: 'copy', label: 'Копировать' },
  { key: 'search', label: 'Поиск' },
] as const;

export function BookReaderSelectionMenu({
  isVisible,
  theme,
  anchor,
  containerWidth,
  onCopy,
  onSearch,
}: BookReaderSelectionMenuProps) {
  if (!isVisible || !anchor) {
    return null;
  }

  const left = Math.min(Math.max(anchor.x - MENU_WIDTH / 2, 12), Math.max(containerWidth - MENU_WIDTH - 12, 12));
  const top = Math.max(anchor.y - 58, 12);

  return (
    <View pointerEvents="box-none" style={styles.overlay}>
      <View
        style={[
          styles.menu,
          {
            backgroundColor: theme.cardColor,
            borderColor: theme.borderColor,
            left,
            top,
          },
        ]}>
        {MENU_ACTIONS.map((action) => {
          const handler = action.key === 'copy' ? onCopy : onSearch;

          return (
            <Pressable
              key={action.key}
              onPress={handler}
              style={({ pressed }) => [
                styles.actionButton,
                {
                  backgroundColor: pressed ? theme.backgroundColor : theme.cardColor,
                  borderColor: theme.borderColor,
                },
              ]}>
              <AppText style={{ color: theme.textColor, fontWeight: '700' }}>{action.label}</AppText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const MENU_WIDTH = 268;

const styles = StyleSheet.create({
  actionButton: {
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    minWidth: 124,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  menu: {
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    position: 'absolute',
    padding: 10,
    width: MENU_WIDTH,
  },
  overlay: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
});
