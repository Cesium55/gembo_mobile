import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { useAppTheme } from '@/providers/theme-provider';

type ChatBubbleProps = {
  text: string;
  role: 'user' | 'assistant';
  score?: number;
  onScorePress?: () => void;
  isSkeleton?: boolean;
  isSpeaking?: boolean;
  onStopSpeaking?: () => void;
};

function getScoreColor(score: number) {
  if (score <= 0) {
    return '#EF4444';
  }
  if (score === 1) {
    return '#F59E0B';
  }
  if (score === 2) {
    return '#84CC16';
  }
  return '#22C55E';
}

export function ChatBubble({
  text,
  role,
  score,
  onScorePress,
  isSkeleton = false,
  isSpeaking = false,
  onStopSpeaking,
}: ChatBubbleProps) {
  const { theme } = useAppTheme();
  const textColor = role === 'user' ? theme.onPrimaryColor : theme.textColor;
  const parts = text.split(/(\*\*\*[^*]+\*\*\*|\*\*[^*]+\*\*|\*[^*]+\*)/g).filter(Boolean);

  return (
    <View style={[styles.wrapper, role === 'user' ? styles.right : styles.left]}>
      <View style={role === 'user' ? styles.userRow : styles.assistantRow}>
        {role === 'user' && typeof score === 'number' ? (
          <Pressable
            onPress={onScorePress}
            style={[
              styles.scoreDot,
              {
                backgroundColor: getScoreColor(score),
                borderColor: theme.borderColor,
              },
            ]}
          />
        ) : null}
        <View
          style={[
            styles.bubble,
            {
              backgroundColor: role === 'user' ? theme.primaryColor : theme.cardColor,
              borderColor: theme.borderColor,
            },
          ]}>
          {isSkeleton ? (
            <View style={styles.skeletonWrap}>
              <View style={[styles.skeletonLine, { backgroundColor: theme.borderColor, width: 140 }]} />
              <View style={[styles.skeletonLine, { backgroundColor: theme.borderColor, width: 90 }]} />
            </View>
          ) : (
            <AppText style={{ color: textColor }}>
              {parts.map((part, index) => {
                if (part.startsWith('***') && part.endsWith('***')) {
                  return (
                    <Text key={`${part}-${index}`} style={styles.boldItalic}>
                      {part.slice(3, -3)}
                    </Text>
                  );
                }

                if (part.startsWith('**') && part.endsWith('**')) {
                  return (
                    <Text key={`${part}-${index}`} style={styles.bold}>
                      {part.slice(2, -2)}
                    </Text>
                  );
                }

                if (part.startsWith('*') && part.endsWith('*')) {
                  return (
                    <Text key={`${part}-${index}`} style={styles.italic}>
                      {part.slice(1, -1)}
                    </Text>
                  );
                }

                return <Text key={`${part}-${index}`}>{part}</Text>;
              })}
            </AppText>
          )}
        </View>
        {role === 'assistant' && isSpeaking ? (
          <Pressable onPress={onStopSpeaking} style={styles.stopWrap}>
            <View style={styles.stopDot}>
              <View style={styles.stopSquare} />
            </View>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 10,
    width: '100%',
  },
  left: {
    alignItems: 'flex-start',
  },
  right: {
    alignItems: 'flex-end',
  },
  bubble: {
    borderRadius: 16,
    borderWidth: 1,
    maxWidth: '80%',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  userRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'flex-end',
  },
  assistantRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'flex-start',
  },
  scoreDot: {
    borderRadius: 999,
    borderWidth: 1,
    height: 19,
    width: 19,
  },
  stopWrap: {
    padding: 2,
  },
  stopDot: {
    alignItems: 'center',
    backgroundColor: '#EF4444',
    borderRadius: 999,
    height: 24,
    justifyContent: 'center',
    width: 24,
  },
  stopSquare: {
    backgroundColor: '#FFFFFF',
    borderRadius: 1,
    height: 9,
    width: 9,
  },
  skeletonWrap: {
    gap: 8,
  },
  skeletonLine: {
    borderRadius: 999,
    height: 10,
  },
  italic: {
    fontStyle: 'italic',
  },
  bold: {
    fontWeight: '700',
  },
  boldItalic: {
    fontStyle: 'italic',
    fontWeight: '700',
  },
});
