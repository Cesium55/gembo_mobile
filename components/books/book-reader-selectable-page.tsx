import { useCallback, useRef } from 'react';
import { NativeSyntheticEvent, Pressable, StyleSheet, TextInput, TextInputSelectionChangeEventData } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { ReaderTheme } from '@/constants/colors';

type BookReaderSelectablePageProps = {
  content: string;
  fontFamily?: string;
  fontSize: number;
  lineHeight: number;
  selectionResetKey: number;
  theme: ReaderTheme;
  title: string | null;
  width: number;
  onSelectedTextChange: (value: string, anchor?: { x: number; y: number } | null) => void;
  onTextInteractionChange: (value: boolean) => void;
};

const PAGE_LEFT_PADDING = 0;
const PAGE_TOP_PADDING = 12;
const TITLE_BOTTOM_MARGIN = 16;
const AVG_CHAR_WIDTH_FACTOR = 0.52;

export function BookReaderSelectablePage({
  content,
  fontFamily,
  fontSize,
  lineHeight,
  selectionResetKey,
  theme,
  title,
  width,
  onSelectedTextChange,
  onTextInteractionChange,
}: BookReaderSelectablePageProps) {
  const inputRef = useRef<TextInput>(null);

  const handleSelectionChange = useCallback(
    (event: NativeSyntheticEvent<TextInputSelectionChangeEventData>) => {
      const { start, end } = event.nativeEvent.selection;

      if (start === end) {
        onTextInteractionChange(false);
        onSelectedTextChange('', null);
        return;
      }

      const prefix = content.slice(0, end);
      const lines = prefix.split('\n');
      const currentLine = lines[lines.length - 1] ?? '';
      const lineIndex = Math.max(lines.length - 1, 0);
      const titleOffset = title ? lineHeight + TITLE_BOTTOM_MARGIN : 0;
      const estimatedX = PAGE_LEFT_PADDING + currentLine.length * fontSize * AVG_CHAR_WIDTH_FACTOR;
      const estimatedY = PAGE_TOP_PADDING + titleOffset + lineIndex * lineHeight;

      onSelectedTextChange(content.slice(start, end), {
        x: Math.min(Math.max(estimatedX, 24), Math.max(width - 24, 24)),
        y: Math.max(estimatedY, 24),
      });
      onTextInteractionChange(true);
    },
    [content, fontSize, lineHeight, onSelectedTextChange, onTextInteractionChange, title, width],
  );

  return (
    <Pressable
      style={[styles.page, { width }]}
      onPressIn={() => {
        onTextInteractionChange(true);
        inputRef.current?.focus();
      }}>
      {title ? (
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
          {title}
        </AppText>
      ) : null}

      <TextInput
        ref={inputRef}
        key={`page-selection-${selectionResetKey}`}
        value={content}
        readOnly
        multiline
        contextMenuHidden
        caretHidden
        autoCorrect={false}
        rejectResponderTermination={false}
        selectTextOnFocus={false}
        spellCheck={false}
        scrollEnabled={false}
        showSoftInputOnFocus={false}
        selectionColor={theme.primaryColor}
        underlineColorAndroid="transparent"
        onBlur={() => onTextInteractionChange(false)}
        onSelectionChange={handleSelectionChange}
        style={[
          styles.pageText,
          {
            color: theme.textColor,
            fontFamily,
            fontSize,
            lineHeight,
          },
        ]}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chapterTitle: {
    fontWeight: '800',
    marginBottom: 16,
    textAlign: 'center',
  },
  page: {
    flex: 1,
    paddingRight: 2,
    paddingTop: 12,
  },
  pageText: {
    flex: 1,
    includeFontPadding: true,
    paddingBottom: 8,
    paddingHorizontal: 0,
    paddingTop: 0,
    textAlignVertical: 'top',
  },
});
