import { useMemo, useState } from 'react';
import { GestureResponderEvent, LayoutChangeEvent, Pressable, StyleSheet, Switch, View } from 'react-native';

import { AppBottomModal } from '@/components/ui/app-bottom-modal';
import { AppText } from '@/components/ui/app-text';
import {
  MAX_READER_FONT_SIZE,
  MIN_READER_FONT_SIZE,
  ReaderFontFamily,
} from '@/providers/reader-preferences-provider';
import { useAppTheme } from '@/providers/theme-provider';

type BookReaderSettingsModalProps = {
  isOpen: boolean;
  fontFamily: ReaderFontFamily;
  fontSize: number;
  isDark: boolean;
  themeName: 'light' | 'dark';
  onClose: () => void;
  onFontFamilyChange: (value: ReaderFontFamily) => void;
  onFontSizeChange: (value: number) => void;
  onToggleTheme: () => void;
};

const FONT_FAMILY_OPTIONS: readonly { key: ReaderFontFamily; label: string }[] = [
  { key: 'serif', label: 'Serif' },
  { key: 'sans', label: 'Sans' },
  { key: 'rounded', label: 'Rounded' },
];
const FONT_SIZE_TICKS = [10, 14, 18, 22, 26, 30];

function clampFontSize(value: number) {
  return Math.min(Math.max(Math.round(value), MIN_READER_FONT_SIZE), MAX_READER_FONT_SIZE);
}

export function BookReaderSettingsModal({
  isOpen,
  fontFamily,
  fontSize,
  isDark,
  themeName,
  onClose,
  onFontFamilyChange,
  onFontSizeChange,
  onToggleTheme,
}: BookReaderSettingsModalProps) {
  const { theme } = useAppTheme();
  const [sliderWidth, setSliderWidth] = useState(0);
  const sliderProgress = useMemo(() => {
    if (MAX_READER_FONT_SIZE === MIN_READER_FONT_SIZE) {
      return 0;
    }

    return (fontSize - MIN_READER_FONT_SIZE) / (MAX_READER_FONT_SIZE - MIN_READER_FONT_SIZE);
  }, [fontSize]);

  const handleSliderLayout = (event: LayoutChangeEvent) => {
    setSliderWidth(event.nativeEvent.layout.width);
  };

  const updateFontSizeFromEvent = (event: GestureResponderEvent) => {
    if (!sliderWidth) {
      return;
    }

    const ratio = Math.min(Math.max(event.nativeEvent.locationX / sliderWidth, 0), 1);
    const nextSize = MIN_READER_FONT_SIZE + ratio * (MAX_READER_FONT_SIZE - MIN_READER_FONT_SIZE);
    onFontSizeChange(clampFontSize(nextSize));
  };

  return (
    <AppBottomModal isOpen={isOpen} onClose={onClose} title="Настройки чтения" scrollable>
      <View style={styles.settingsContent}>
        <View style={[styles.settingsBlock, { backgroundColor: theme.backgroundColor, borderColor: theme.borderColor }]}>
          <AppText style={{ color: theme.mutedTextColor }}>Шрифт</AppText>
          <View style={styles.optionRow}>
            {FONT_FAMILY_OPTIONS.map((option) => {
              const isActive = fontFamily === option.key;

              return (
                <Pressable
                  key={option.key}
                  onPress={() => onFontFamilyChange(option.key)}
                  style={[
                    styles.optionButton,
                    {
                      backgroundColor: isActive ? theme.primaryColor : theme.cardColor,
                      borderColor: theme.borderColor,
                    },
                  ]}>
                  <AppText style={{ color: isActive ? theme.onPrimaryColor : theme.textColor }}>{option.label}</AppText>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={[styles.settingsBlock, { backgroundColor: theme.backgroundColor, borderColor: theme.borderColor }]}>
          <View style={styles.rowBetween}>
            <AppText style={{ color: theme.mutedTextColor }}>Размер текста</AppText>
            <View style={styles.fontSizeControls}>
              <Pressable
                onPress={() => onFontSizeChange(clampFontSize(fontSize - 1))}
                style={[styles.stepButton, { backgroundColor: theme.cardColor, borderColor: theme.borderColor }]}>
                <AppText style={{ color: theme.textColor, fontWeight: '700' }}>-</AppText>
              </Pressable>
              <Pressable
                onPress={() => onFontSizeChange(clampFontSize(fontSize + 1))}
                style={[styles.stepButton, { backgroundColor: theme.cardColor, borderColor: theme.borderColor }]}>
                <AppText style={{ color: theme.textColor, fontWeight: '700' }}>+</AppText>
              </Pressable>
              <AppText style={{ color: theme.textColor, fontWeight: '700', minWidth: 28, textAlign: 'right' }}>{fontSize}</AppText>
            </View>
          </View>
          <View
            onLayout={handleSliderLayout}
            onStartShouldSetResponder={() => true}
            onResponderGrant={updateFontSizeFromEvent}
            style={styles.sliderWrap}>
            <View style={[styles.sliderTrack, { backgroundColor: theme.borderColor }]}>
              <View style={[styles.sliderFill, { backgroundColor: theme.primaryColor, width: `${sliderProgress * 100}%` }]} />
            </View>
            <View style={styles.sliderTicks}>
              {FONT_SIZE_TICKS.map((tick) => {
                const tickProgress =
                  (tick - MIN_READER_FONT_SIZE) / (MAX_READER_FONT_SIZE - MIN_READER_FONT_SIZE);

                return (
                  <View
                    key={`tick-${tick}`}
                    style={[
                      styles.sliderTick,
                      {
                        backgroundColor: tick <= fontSize ? theme.primaryColor : theme.mutedTextColor,
                        left: `${tickProgress * 100}%`,
                      },
                    ]}
                  />
                );
              })}
            </View>
            <View
              style={[
                styles.sliderThumb,
                {
                  backgroundColor: theme.primaryColor,
                  borderColor: theme.cardColor,
                  left: `${sliderProgress * 100}%`,
                },
              ]}
            />
          </View>
          <View style={styles.sliderLabels}>
            <AppText style={{ color: theme.mutedTextColor }}>{MIN_READER_FONT_SIZE}</AppText>
            <AppText style={{ color: theme.mutedTextColor }}>{MAX_READER_FONT_SIZE}</AppText>
          </View>
        </View>

        <View style={[styles.settingsBlock, { backgroundColor: theme.backgroundColor, borderColor: theme.borderColor }]}>
          <View style={styles.rowBetween}>
            <View style={styles.themeCopy}>
              <AppText style={{ color: theme.textColor, fontWeight: '700' }}>Тема приложения</AppText>
              <AppText style={{ color: theme.mutedTextColor }}>
                Переключает тему сразу во всем приложении.
              </AppText>
            </View>
            <Switch value={isDark} onValueChange={onToggleTheme} />
          </View>
          <View style={styles.optionRow}>
            {[
              { key: 'light', label: 'Светлая' },
              { key: 'dark', label: 'Темная' },
            ].map((option) => {
              const isActive = themeName === option.key;

              return (
                <Pressable
                  key={option.key}
                  onPress={() => {
                    if (!isActive) {
                      onToggleTheme();
                    }
                  }}
                  style={[
                    styles.optionButton,
                    {
                      backgroundColor: isActive ? theme.primaryColor : theme.cardColor,
                      borderColor: theme.borderColor,
                    },
                  ]}>
                  <AppText style={{ color: isActive ? theme.onPrimaryColor : theme.textColor }}>{option.label}</AppText>
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>
    </AppBottomModal>
  );
}

const styles = StyleSheet.create({
  fontSizeControls: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  optionButton: {
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    minWidth: 72,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  optionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  rowBetween: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  settingsBlock: {
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  settingsContent: {
    gap: 12,
  },
  stepButton: {
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  sliderFill: {
    borderRadius: 999,
    height: '100%',
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sliderThumb: {
    borderRadius: 999,
    borderWidth: 3,
    height: 20,
    marginLeft: -10,
    position: 'absolute',
    top: 3,
    width: 20,
  },
  sliderTick: {
    borderRadius: 999,
    height: 10,
    marginLeft: -1,
    position: 'absolute',
    top: 8,
    width: 2,
  },
  sliderTicks: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  sliderTrack: {
    borderRadius: 999,
    height: 6,
    overflow: 'hidden',
  },
  sliderWrap: {
    height: 26,
    justifyContent: 'center',
    position: 'relative',
  },
  themeCopy: {
    flex: 1,
    gap: 4,
  },
});
