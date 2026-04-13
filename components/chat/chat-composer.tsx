import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { useAppTheme } from '@/providers/theme-provider';

type ChatComposerProps = {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  onToggleMic: () => void;
  isListening: boolean;
  showWave?: boolean;
  isWaveMocked?: boolean;
  isMicAvailable: boolean;
  disabled?: boolean;
  listeningLevel?: number;
};

export function ChatComposer({
  value,
  onChange,
  onSend,
  onToggleMic,
  isListening,
  showWave = false,
  isWaveMocked = false,
  isMicAvailable,
  disabled = false,
  listeningLevel = 0,
}: ChatComposerProps) {
  const { theme } = useAppTheme();
  const isSendDisabled = disabled || !value.trim();
  const isMicDisabled = disabled || !isMicAvailable;
  const [waveTick, setWaveTick] = useState(0);

  useEffect(() => {
    if (!showWave) {
      return;
    }

    const interval = setInterval(() => {
      setWaveTick((current) => current + 1);
    }, 90);

    return () => clearInterval(interval);
  }, [showWave]);

  return (
    <View style={[styles.container, { backgroundColor: theme.cardColor, borderColor: theme.borderColor }]}>
      {showWave ? (
        <View style={styles.waveContainer}>
          {Array.from({ length: 24 }).map((_, index, array) => {
            const clampedLevel = Math.min(Math.max(listeningLevel, 0), 1);
            const center = (array.length - 1) / 2;
            const distance = Math.abs(index - center) / center;
            const profile = 1 - distance * 0.7;
            const baseHeight = 5 + profile * 4;
            const signalHeight = clampedLevel * (22 + profile * 10);
            const mockNoise = isWaveMocked ? Math.abs(Math.sin(waveTick * 0.7 + index * 0.9)) * 14 : 0;
            const livePulse = !isWaveMocked ? (Math.sin(waveTick * 0.22 + index * 0.35) + 1) * 1.4 : 0;
            const height = baseHeight + signalHeight + mockNoise + livePulse;
            return <View key={`wave-${index}`} style={[styles.waveBar, { height, backgroundColor: theme.primaryColor }]} />;
          })}
        </View>
      ) : (
        <TextInput
          value={value}
          onChangeText={onChange}
          editable={!disabled}
          placeholder="Напиши сообщение"
          placeholderTextColor={theme.mutedTextColor}
          style={[styles.input, { color: theme.textColor }]}
        />
      )}
      <Pressable
        disabled={isMicDisabled}
        onPress={onToggleMic}
        style={[
          styles.actionButton,
          {
            backgroundColor: isListening ? theme.primaryColor : theme.cardColor,
            borderColor: theme.borderColor,
            opacity: isMicDisabled ? 0.5 : 1,
          },
        ]}>
        <Ionicons name={isListening ? 'stop' : 'mic'} size={18} color={isListening ? theme.onPrimaryColor : theme.textColor} />
      </Pressable>
      <Pressable
        disabled={isSendDisabled}
        style={[styles.sendButton, { backgroundColor: theme.primaryColor, opacity: isSendDisabled ? 0.5 : 1 }]}
        onPress={onSend}>
        <Ionicons name="arrow-up" size={20} color={theme.onPrimaryColor} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    borderRadius: 30,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingHorizontal: 8,
    paddingVertical: 10,
  },
  waveContainer: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  waveBar: {
    borderRadius: 999,
    maxWidth: 5,
    minWidth: 2,
    width: '3%',
  },
  sendButton: {
    alignItems: 'center',
    borderRadius: 30,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  actionButton: {
    alignItems: 'center',
    borderRadius: 30,
    borderWidth: 1,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
});
