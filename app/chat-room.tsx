import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ExpoSpeech from 'expo-speech';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Animated, FlatList, Keyboard, Modal, Pressable, StyleSheet, Switch, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { ChatBubble } from '@/components/chat/chat-bubble';
import { ChatComposer } from '@/components/chat/chat-composer';
import { AppBottomModal } from '@/components/ui/app-bottom-modal';
import { AppText } from '@/components/ui/app-text';
import { buildAiUrl } from '@/constants/ai-config';
import { useAuth } from '@/providers/auth-provider';
import { useAppTheme } from '@/providers/theme-provider';

type ChatMessage = {
  id: string;
  apiMessageId?: number;
  role: 'user' | 'assistant';
  text: string;
  sentAt: string;
  isSkeleton?: boolean;
};

type ChatSummary = {
  id: number;
  user_id: number;
  title: string;
};

type ChatsResponse = {
  chats: ChatSummary[];
};

type SpeechModule = {
  addListener: (eventName: string, listener: (event?: any) => void) => { remove: () => void };
  stop: () => void;
  abort: () => void;
  start: (options: Record<string, unknown>) => void;
  requestPermissionsAsync: () => Promise<{ granted: boolean }>;
};

type APIMessage = {
  id: number;
  is_ai: boolean;
  content: string;
  sent_at: string;
  total_tokens?: number;
};

type ChatDetailsResponse = {
  id: number;
  title: string;
  total_tokens_sum?: number;
  messages: APIMessage[];
};

type SendMessageResponse = {
  chat_id: number;
  user_message: APIMessage;
  ai_message: APIMessage;
};

type MessageScoreResponse = {
  id: number;
  message_id: number;
  score: number;
  comment: string;
  correct_verison?: string;
  correct_version?: string;
  model: string;
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
};

type ChatScoresResponse = {
  scores: MessageScoreResponse[];
};

type SpeechGender = 'auto' | 'female' | 'male';

const STARTER_PROMPTS = [
  'Tell me about spicy food',
  "Let's talk about traveling",
  "Let's discuss politics",
  'What interesting technologies have been invented recently?',
];
const CHAT_TOKEN_LIMIT = 10000;
const SPEECH_SETTINGS_KEY = 'chat_speech_settings_v1';

function getScoreColor(score: number, isDark: boolean) {
  if (score <= 0) {
    return isDark ? '#7F1D1D' : '#FEE2E2';
  }
  if (score === 1) {
    return isDark ? '#78350F' : '#FEF3C7';
  }
  if (score === 2) {
    return isDark ? '#365314' : '#ECFCCB';
  }
  return isDark ? '#14532D' : '#DCFCE7';
}

function getCommentColor(isDark: boolean) {
  return isDark ? '#0C4A6E' : '#E0F2FE';
}

function getCorrectColor(isDark: boolean) {
  return isDark ? '#14532D' : '#DCFCE7';
}

function selectVoiceIdentifier(
  voices: { identifier?: string; language?: string; name?: string }[],
  gender: SpeechGender,
) {
  const englishVoices = voices.filter((voice) => voice.language?.toLowerCase().startsWith('en'));
  const source = englishVoices.length ? englishVoices : voices;
  if (!source.length) {
    return undefined;
  }

  if (gender === 'auto') {
    return source[0]?.identifier;
  }

  const femaleKeywords = ['female', 'woman', 'samantha', 'victoria', 'karen', 'zira', 'ava', 'susan'];
  const maleKeywords = ['male', 'man', 'daniel', 'alex', 'fred', 'tom', 'david', 'mark'];
  const keywords = gender === 'female' ? femaleKeywords : maleKeywords;

  const matched = source.find((voice) => {
    const name = (voice.name ?? '').toLowerCase();
    return keywords.some((keyword) => name.includes(keyword));
  });

  return matched?.identifier ?? source[0]?.identifier;
}

let speechModule: SpeechModule | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const speechPackage = require('expo-speech-recognition');
  speechModule = speechPackage.ExpoSpeechRecognitionModule as SpeechModule;
} catch {
  speechModule = null;
}

export default function ChatRoomScreen() {
  const { theme } = useAppTheme();
  const isDarkTheme = theme.backgroundColor === '#000000';
  const { authFetch } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { chatId: chatIdParam } = useLocalSearchParams<{ chatId?: string }>();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [chatId, setChatId] = useState<number | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [totalTokens, setTotalTokens] = useState(0);
  const [speakingMessageId, setSpeakingMessageId] = useState<number | null>(null);
  const [speechEnabled, setSpeechEnabled] = useState(true);
  const [voiceRate, setVoiceRate] = useState(1);
  const [voicePitch, setVoicePitch] = useState(1);
  const [voiceGender, setVoiceGender] = useState<SpeechGender>('auto');
  const [availableVoices, setAvailableVoices] = useState<{ identifier?: string; language?: string; name?: string }[]>([]);
  const [isSpeechSettingsReady, setIsSpeechSettingsReady] = useState(false);
  const [micLevel, setMicLevel] = useState(0);
  const [mockMicEnabled, setMockMicEnabled] = useState(false);
  const [mockMicLevel, setMockMicLevel] = useState(0);
  const [assistantSettingsOpen, setAssistantSettingsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [messageScores, setMessageScores] = useState<Record<number, MessageScoreResponse>>({});
  const [selectedScore, setSelectedScore] = useState<{ score: MessageScoreResponse; originalText: string } | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [historyChats, setHistoryChats] = useState<ChatSummary[]>([]);
  const [isLoadingChatHistory, setIsLoadingChatHistory] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const isMicAvailable = speechModule !== null;
  const isTokenLimitReached = totalTokens >= CHAT_TOKEN_LIMIT;
  const isInputLocked = isSending || isLoadingHistory || isTokenLimitReached;
  const listRef = useRef<FlatList<ChatMessage>>(null);
  const shouldKeepListeningRef = useRef(false);
  const keyboardOffset = useState(new Animated.Value(0))[0];

  const initialChatId = useMemo(() => {
    if (!chatIdParam) {
      return null;
    }

    const parsed = Number(chatIdParam);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      return null;
    }

    return parsed;
  }, [chatIdParam]);

  const toMessage = useCallback((message: APIMessage, fallbackRole?: 'user' | 'assistant'): ChatMessage => {
    const role = fallbackRole ?? (message.is_ai ? 'assistant' : 'user');
    return {
      id: `${message.id}-${message.sent_at}-${role}`,
      apiMessageId: message.id,
      role,
      text: message.content,
      sentAt: message.sent_at,
    };
  }, []);

  const readErrorMessage = useCallback(async (response: Response) => {
    try {
      const raw = await response.text();
      if (!raw) {
        return `Request failed (${response.status})`;
      }

      const parsed = JSON.parse(raw) as { message?: string };
      return parsed.message ?? `Request failed (${response.status})`;
    } catch {
      return `Request failed (${response.status})`;
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    const bootstrapSpeechSettings = async () => {
      try {
        const [rawSettings, voices] = await Promise.all([
          AsyncStorage.getItem(SPEECH_SETTINGS_KEY),
          ExpoSpeech.getAvailableVoicesAsync(),
        ]);

        if (!isMounted) {
          return;
        }

        setAvailableVoices(voices as { identifier?: string; language?: string; name?: string }[]);

        if (rawSettings) {
          const parsed = JSON.parse(rawSettings) as Partial<{
            enabled: boolean;
            rate: number;
            pitch: number;
            gender: SpeechGender;
            micMockEnabled: boolean;
          }>;
          setSpeechEnabled(parsed.enabled ?? true);
          setVoiceRate(parsed.rate ?? 1);
          setVoicePitch(parsed.pitch ?? 1);
          setVoiceGender(parsed.gender ?? 'auto');
          setMockMicEnabled(parsed.micMockEnabled ?? false);
        }
      } catch {
        if (isMounted) {
          setAvailableVoices([]);
        }
      } finally {
        if (isMounted) {
          setIsSpeechSettingsReady(true);
        }
      }
    };

    void bootstrapSpeechSettings();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!isSpeechSettingsReady) {
      return;
    }

    void AsyncStorage.setItem(
      SPEECH_SETTINGS_KEY,
      JSON.stringify({
        enabled: speechEnabled,
        rate: voiceRate,
        pitch: voicePitch,
        gender: voiceGender,
        micMockEnabled: mockMicEnabled,
      }),
    );
  }, [isSpeechSettingsReady, mockMicEnabled, speechEnabled, voiceGender, voicePitch, voiceRate]);

  useEffect(() => {
    if (!mockMicEnabled || isListening) {
      setMockMicLevel(0);
      return;
    }

    const interval = setInterval(() => {
      setMockMicLevel((current) => {
        const delta = (Math.random() - 0.5) * 0.5;
        const next = Math.max(0.08, Math.min(1, current + delta));
        return Number.isFinite(next) ? next : 0.2;
      });
    }, 120);

    return () => clearInterval(interval);
  }, [isListening, mockMicEnabled]);

  const loadChatsHistory = useCallback(async () => {
    setIsLoadingChatHistory(true);
    setHistoryError(null);

    try {
      const response = await authFetch(buildAiUrl('/chat'), { method: 'GET' });
      if (!response.ok) {
        throw new Error(await readErrorMessage(response));
      }

      const payload = (await response.json()) as ChatsResponse;
      setHistoryChats(payload.chats);
    } catch (unknownError) {
      const message = unknownError instanceof Error ? unknownError.message : 'Не удалось загрузить историю';
      setHistoryError(message);
    } finally {
      setIsLoadingChatHistory(false);
    }
  }, [authFetch, readErrorMessage]);

  const loadChatScores = useCallback(
    async (targetChatId: number) => {
      try {
        const response = await authFetch(buildAiUrl(`/chat/${targetChatId}/scores`), { method: 'GET' });
        if (!response.ok) {
          return;
        }

        const payload = (await response.json()) as ChatScoresResponse;
        const nextScores: Record<number, MessageScoreResponse> = {};
        payload.scores.forEach((score) => {
          nextScores[score.message_id] = score;
        });
        setMessageScores(nextScores);
      } catch {
        // By requirement scores are optional: ignore errors and render nothing.
      }
    },
    [authFetch],
  );

  const loadChat = useCallback(
    async (targetChatId: number) => {
      setIsLoadingHistory(true);
      setError(null);
      setMessageScores({});

      try {
        const response = await authFetch(buildAiUrl(`/chat/${targetChatId}`), { method: 'GET' });
        if (!response.ok) {
          throw new Error(await readErrorMessage(response));
        }

        const payload = (await response.json()) as ChatDetailsResponse;
        setChatId(payload.id);
        setTotalTokens(payload.total_tokens_sum ?? 0);
        setMessages(payload.messages.map((item) => toMessage(item)));
        void loadChatScores(payload.id);
      } catch (unknownError) {
        const message = unknownError instanceof Error ? unknownError.message : 'Не удалось загрузить чат';
        setError(message);
      } finally {
        setIsLoadingHistory(false);
      }
    },
    [authFetch, loadChatScores, readErrorMessage, toMessage],
  );

  const loadChatRef = useRef(loadChat);
  useEffect(() => {
    loadChatRef.current = loadChat;
  }, [loadChat]);

  const sendMessage = useCallback(
    async (rawText: string) => {
      const text = rawText.trim();
      if (!text || isSending || isLoadingHistory || isTokenLimitReached) {
        return;
      }

      const optimisticId = `optimistic-${Date.now()}`;
      const optimisticMessage: ChatMessage = {
        id: optimisticId,
        role: 'user',
        text,
        sentAt: new Date().toISOString(),
      };
      const optimisticAssistantId = `optimistic-assistant-${Date.now()}`;
      const optimisticAssistantMessage: ChatMessage = {
        id: optimisticAssistantId,
        role: 'assistant',
        text: '',
        sentAt: new Date().toISOString(),
        isSkeleton: true,
      };

      setIsSending(true);
      setError(null);
      setMessages((previous) => [...previous, optimisticMessage, optimisticAssistantMessage]);

      try {
        const response = await authFetch(buildAiUrl('/chat/message'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: text,
            chat_id: chatId ?? 0,
          }),
        });

        if (!response.ok) {
          throw new Error(await readErrorMessage(response));
        }

        const payload = (await response.json()) as SendMessageResponse;
        if (payload.chat_id > 0) {
          setChatId(payload.chat_id);
        }

        setTotalTokens((previous) => previous + (payload.user_message.total_tokens ?? 0) + (payload.ai_message.total_tokens ?? 0));
        setMessages((previous) => [
          ...previous.map((message) =>
            message.id === optimisticId
              ? toMessage(payload.user_message, 'user')
              : message.id === optimisticAssistantId
                ? toMessage(payload.ai_message, 'assistant')
                : message,
          ),
        ]);
        if (speechEnabled && payload.ai_message.content.trim()) {
          ExpoSpeech.stop();
          setSpeakingMessageId(payload.ai_message.id);
          const selectedVoiceIdentifier = selectVoiceIdentifier(availableVoices, voiceGender);
          ExpoSpeech.speak(payload.ai_message.content, {
            language: 'en-US',
            pitch: voicePitch,
            rate: voiceRate,
            voice: selectedVoiceIdentifier,
            onDone: () => setSpeakingMessageId(null),
            onStopped: () => setSpeakingMessageId(null),
            onError: () => setSpeakingMessageId(null),
          });
        }

        void (async () => {
          try {
            const scoreResponse = await authFetch(buildAiUrl(`/chat/message/${payload.user_message.id}/score`), {
              method: 'GET',
            });
            if (!scoreResponse.ok) {
              return;
            }

            const scorePayload = (await scoreResponse.json()) as MessageScoreResponse;
            setMessageScores((previous) => ({ ...previous, [scorePayload.message_id]: scorePayload }));
          } catch {
            // Score rendering is optional by requirement; ignore failures.
          }
        })();
      } catch (unknownError) {
        const message = unknownError instanceof Error ? unknownError.message : 'Не удалось отправить сообщение';
        setMessages((previous) =>
          previous.filter((item) => item.id !== optimisticId && item.id !== optimisticAssistantId),
        );
        setError(message);
      } finally {
        setIsSending(false);
      }
    },
    [authFetch, availableVoices, chatId, isLoadingHistory, isSending, isTokenLimitReached, readErrorMessage, speechEnabled, toMessage, voiceGender, voicePitch, voiceRate],
  );

  const scrollToBottom = () => {
    listRef.current?.scrollToEnd({ animated: true });
  };

  useEffect(() => {
    if (!speechModule) {
      return;
    }

    const startSubscription = speechModule.addListener('start', () => {
      setIsListening(true);
    });
    const errorSubscription = speechModule.addListener('error', () => {
      setIsListening(false);
      setMicLevel(0);
    });
    const volumeSubscription = speechModule.addListener('volumechange', (event) => {
      const rawLevel = Number(event?.value ?? event?.volume ?? event?.rms ?? 0);
      if (!Number.isFinite(rawLevel)) {
        return;
      }
      const normalized = rawLevel > 1 ? Math.min(rawLevel / 30, 1) : Math.max(rawLevel, 0);
      setMicLevel(normalized);
    });
    const resultSubscription = speechModule.addListener('result', (event) => {
      const transcript = event?.results?.[0]?.transcript;
      if (transcript) {
        setInput(transcript);
      }
    });
    const endSubscription = speechModule.addListener('end', () => {
      if (shouldKeepListeningRef.current) {
        speechModule.start({
          interimResults: true,
          maxAlternatives: 1,
          addsPunctuation: true,
          continuous: true,
        });
      } else {
        setIsListening(false);
        setMicLevel(0);
      }
    });

    return () => {
      startSubscription.remove();
      errorSubscription.remove();
      volumeSubscription.remove();
      resultSubscription.remove();
      endSubscription.remove();
      shouldKeepListeningRef.current = false;
      speechModule?.abort();
    };
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    return () => {
      ExpoSpeech.stop();
    };
  }, []);

  useEffect(() => {
    if (!speechEnabled) {
      ExpoSpeech.stop();
      setSpeakingMessageId(null);
    }
  }, [speechEnabled]);

  useEffect(() => {
    if (!initialChatId) {
      setChatId(null);
      setTotalTokens(0);
      setMessageScores({});
      setMessages([]);
      return;
    }

    void loadChatRef.current(initialChatId);
  }, [initialChatId]);

  useEffect(() => {
    const showSubscription = Keyboard.addListener('keyboardDidShow', (event) => {
      Animated.timing(keyboardOffset, {
        toValue: event.endCoordinates.height,
        duration: 250,
        useNativeDriver: false,
      }).start();
      setTimeout(scrollToBottom, 260);
    });

    const hideSubscription = Keyboard.addListener('keyboardDidHide', () => {
      Animated.timing(keyboardOffset, {
        toValue: 0,
        duration: 250,
        useNativeDriver: false,
      }).start();
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, [keyboardOffset]);

  const handleToggleMic = async () => {
    if (!speechModule || isInputLocked) {
      return;
    }

    if (isListening) {
      shouldKeepListeningRef.current = false;
      speechModule.stop();
      setMicLevel(0);
      return;
    }

    const permission = await speechModule.requestPermissionsAsync();
    if (!permission.granted) {
      return;
    }

    shouldKeepListeningRef.current = true;
    speechModule.start({
      interimResults: true,
      maxAlternatives: 1,
      addsPunctuation: true,
      continuous: true,
    });
  };

  const handleSend = () => {
    const text = input.trim();
    if (!text || isInputLocked) {
      return;
    }

    setInput('');
    void sendMessage(text);
  };

  const handleOpenHistory = () => {
    setMenuOpen(false);
    setHistoryModalOpen(true);
    void loadChatsHistory();
  };

  const handleStartNewChat = () => {
    ExpoSpeech.stop();
    shouldKeepListeningRef.current = false;
    speechModule?.stop();
    setMenuOpen(false);
    setHistoryModalOpen(false);
    setChatId(null);
    setTotalTokens(0);
    setSpeakingMessageId(null);
    setMessageScores({});
    setSelectedScore(null);
    setMessages([]);
    setError(null);
    setInput('');
    router.replace('/chat-room');
  };

  const handleHistoryItemPress = (targetChatId: number) => {
    ExpoSpeech.stop();
    shouldKeepListeningRef.current = false;
    speechModule?.stop();
    setSpeakingMessageId(null);
    setHistoryModalOpen(false);
    router.push({
      pathname: '/chat-room',
      params: { chatId: String(targetChatId) },
    });
  };

  const handleStopSpeaking = () => {
    ExpoSpeech.stop();
    setSpeakingMessageId(null);
  };

  return (
    <View style={[styles.root, { backgroundColor: theme.backgroundColor }]}> 
      <Stack.Screen
        options={{
          headerTitle: () => (
            <Pressable style={styles.headerAssistant} onPress={() => setAssistantSettingsOpen(true)}>
              <View style={[styles.headerAssistantAvatar, { backgroundColor: theme.cardColor, borderColor: theme.borderColor }]}>
                <Ionicons name="person-outline" size={14} color={theme.textColor} />
              </View>
              <AppText style={[styles.headerAssistantText, { color: theme.textColor }]}>AI-assistant</AppText>
            </Pressable>
          ),
          headerRight: () => (
            <Pressable onPress={() => setMenuOpen((current) => !current)} style={styles.headerMenuButton}>
              <Ionicons name="ellipsis-vertical" size={20} color={theme.textColor} />
            </Pressable>
          ),
        }}
      />

      <Animated.View
        style={[
          styles.listAnimated,
          {
            transform: [{ translateY: Animated.multiply(keyboardOffset, -1) }],
          },
        ]}>
        <FlatList
          ref={listRef}
          style={styles.list}
          contentContainerStyle={messages.length ? styles.listContent : styles.emptyListContent}
          data={messages}
          keyExtractor={(item) => item.id}
          keyboardShouldPersistTaps="handled"
          onContentSizeChange={scrollToBottom}
          onLayout={scrollToBottom}
          ListEmptyComponent={
            isLoadingHistory ? (
              <View style={styles.loaderWrap}>
                <ActivityIndicator size="small" color={theme.primaryColor} />
              </View>
            ) : (
              <View style={styles.emptyState}>
                <AppText style={[styles.emptyTitle, { color: theme.textColor }]}>Start a conversation</AppText>
                <View style={styles.prompts}>
                  {STARTER_PROMPTS.map((prompt) => (
                    <Pressable
                      key={prompt}
                      disabled={isInputLocked}
                      onPress={() => {
                        if (!isInputLocked) {
                          void sendMessage(prompt);
                        }
                      }}
                      style={[
                        styles.promptButton,
                        {
                          backgroundColor: theme.cardColor,
                          borderColor: theme.borderColor,
                          opacity: isInputLocked ? 0.6 : 1,
                        },
                      ]}>
                      <AppText style={{ color: theme.textColor }}>{prompt}</AppText>
                    </Pressable>
                  ))}
                </View>
              </View>
            )
          }
          renderItem={({ item }) => {
            const messageScore = item.apiMessageId ? messageScores[item.apiMessageId] : undefined;
            return (
              <ChatBubble
                text={item.text}
                role={item.role}
                isSkeleton={Boolean(item.isSkeleton)}
                score={item.role === 'user' ? messageScore?.score : undefined}
                isSpeaking={item.role === 'assistant' && Boolean(item.apiMessageId && item.apiMessageId === speakingMessageId)}
                onStopSpeaking={item.role === 'assistant' ? handleStopSpeaking : undefined}
                onScorePress={
                  item.role === 'user' && messageScore
                    ? () => setSelectedScore({ score: messageScore, originalText: item.text })
                    : undefined
                }
              />
            );
          }}
        />

        {error ? (
          <View style={styles.errorWrap}>
            <AppText style={[styles.errorText, { color: '#EF4444' }]}>{error}</AppText>
          </View>
        ) : null}
        {isTokenLimitReached ? (
          <View style={styles.errorWrap}>
            <AppText style={[styles.errorText, { color: '#EF4444' }]}>
              Достигнут лимит токенов в чате ({totalTokens}/{CHAT_TOKEN_LIMIT})
            </AppText>
          </View>
        ) : (
          <View style={styles.errorWrap}>
            <AppText style={[styles.errorText, { color: theme.mutedTextColor }]}>
              Tokens: {totalTokens}/{CHAT_TOKEN_LIMIT}
            </AppText>
          </View>
        )}
      </Animated.View>

      <Modal animationType="none" transparent visible={menuOpen} onRequestClose={() => setMenuOpen(false)}>
        <Pressable style={styles.menuOverlay} onPress={() => setMenuOpen(false)}>
          <View
            style={[
              styles.menu,
              {
                backgroundColor: theme.cardColor,
                borderColor: theme.borderColor,
                top: insets.top + 42,
              },
            ]}>
            <Pressable style={styles.menuItem} onPress={handleOpenHistory}>
              <Ionicons name="time-outline" size={18} color={theme.textColor} />
              <AppText style={{ color: theme.textColor }}>История</AppText>
            </Pressable>
            <Pressable style={styles.menuItem} onPress={handleStartNewChat}>
              <Ionicons name="add-circle-outline" size={18} color={theme.textColor} />
              <AppText style={{ color: theme.textColor }}>Новый чат</AppText>
            </Pressable>
          </View>
        </Pressable>
      </Modal>

      <Animated.View
        style={[
          styles.composerAnimated,
          {
            transform: [{ translateY: Animated.multiply(keyboardOffset, -1) }],
          },
        ]}>
        <SafeAreaView
          edges={['bottom', 'left', 'right']}
          style={[styles.composerSafeArea, { backgroundColor: theme.backgroundColor }]}> 
          <ChatComposer
            value={input}
            onChange={setInput}
            onSend={handleSend}
            onToggleMic={handleToggleMic}
            isListening={isListening}
            showWave={isListening || (mockMicEnabled && !isInputLocked)}
            isWaveMocked={!isListening && mockMicEnabled && !isInputLocked}
            isMicAvailable={isMicAvailable}
            disabled={isInputLocked}
            listeningLevel={isListening ? micLevel : mockMicLevel}
          />
        </SafeAreaView>
      </Animated.View>

      <AppBottomModal isOpen={historyModalOpen} onClose={() => setHistoryModalOpen(false)} title="История чатов">
        {isLoadingChatHistory ? (
          <View style={styles.modalCenter}>
            <ActivityIndicator size="small" color={theme.primaryColor} />
          </View>
        ) : historyError ? (
          <View style={styles.modalCenter}>
            <AppText style={{ color: '#EF4444', textAlign: 'center' }}>{historyError}</AppText>
          </View>
        ) : (
          <FlatList
            data={historyChats}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={historyChats.length ? styles.historyList : styles.modalCenter}
            renderItem={({ item }) => (
              <Pressable
                onPress={() => handleHistoryItemPress(item.id)}
                style={[styles.historyItem, { backgroundColor: theme.backgroundColor, borderColor: theme.borderColor }]}>
                <View style={styles.historyBody}>
                  <AppText style={{ color: theme.textColor, fontWeight: '700' }} numberOfLines={1}>
                    {item.title || `Chat #${item.id}`}
                  </AppText>
                  <AppText style={{ color: theme.mutedTextColor }}>ID: {item.id}</AppText>
                </View>
                <Ionicons name="chevron-forward" size={18} color={theme.mutedTextColor} />
              </Pressable>
            )}
            ListEmptyComponent={<AppText style={{ color: theme.mutedTextColor }}>История чатов пуста</AppText>}
          />
        )}
      </AppBottomModal>

      <AppBottomModal isOpen={Boolean(selectedScore)} onClose={() => setSelectedScore(null)} title="Оценка сообщения" scrollable>
        {selectedScore ? (
          <View style={styles.scoreContent}>
            <View
              style={[
                styles.scoreBlock,
                {
                  backgroundColor: getScoreColor(selectedScore.score.score, isDarkTheme),
                  borderColor: theme.borderColor,
                },
              ]}>
              <AppText style={{ color: theme.mutedTextColor }}>Исходное сообщение</AppText>
              <AppText style={{ color: theme.textColor }}>{selectedScore.originalText}</AppText>
            </View>

            {selectedScore.score.score === 3 ? (
              <View style={[styles.scoreBlock, { backgroundColor: getCorrectColor(isDarkTheme), borderColor: theme.borderColor }]}>
                <AppText style={{ color: isDarkTheme ? '#D1FAE5' : '#166534' }}>Все правильно, исправления не требуются.</AppText>
              </View>
            ) : (
              <>
                <View style={[styles.scoreBlock, { backgroundColor: getCommentColor(isDarkTheme), borderColor: theme.borderColor }]}>
                  <AppText style={{ color: isDarkTheme ? '#E0F2FE' : '#0C4A6E' }}>Комментарий</AppText>
                  <AppText style={{ color: theme.textColor }}>{selectedScore.score.comment}</AppText>
                </View>
                <View style={[styles.scoreBlock, { backgroundColor: getCorrectColor(isDarkTheme), borderColor: theme.borderColor }]}>
                  <AppText style={{ color: isDarkTheme ? '#D1FAE5' : '#166534' }}>Исправленная версия</AppText>
                  <AppText style={{ color: theme.textColor }}>
                    {selectedScore.score.correct_verison ?? selectedScore.score.correct_version ?? '—'}
                  </AppText>
                </View>
              </>
            )}
          </View>
        ) : null}
      </AppBottomModal>

      <AppBottomModal isOpen={assistantSettingsOpen} onClose={() => setAssistantSettingsOpen(false)} title="AI-assistant" scrollable>
        <View style={styles.assistantSettingsContent}>
          <View style={[styles.assistantHeaderCard, { backgroundColor: theme.backgroundColor, borderColor: theme.borderColor }]}>
            <View style={[styles.assistantAvatarLarge, { backgroundColor: theme.cardColor, borderColor: theme.borderColor }]}>
              <Ionicons name="person-outline" size={18} color={theme.textColor} />
            </View>
            <AppText style={{ color: theme.textColor, fontWeight: '700' }}>AI-assistant</AppText>
          </View>

          <View style={[styles.assistantBlock, { backgroundColor: theme.backgroundColor, borderColor: theme.borderColor }]}>
            <View style={styles.rowBetween}>
              <AppText style={{ color: theme.textColor }}>Озвучка ответов</AppText>
              <Switch value={speechEnabled} onValueChange={setSpeechEnabled} />
            </View>
          </View>

          <View style={[styles.assistantBlock, { backgroundColor: theme.backgroundColor, borderColor: theme.borderColor }]}>
            <View style={styles.rowBetween}>
              <AppText style={{ color: theme.textColor }}>Mock визуализация микрофона</AppText>
              <Switch value={mockMicEnabled} onValueChange={setMockMicEnabled} />
            </View>
            <AppText style={{ color: theme.mutedTextColor, fontSize: 13 }}>
              Показывает рандомные уровни громкости в поле ввода, чтобы проверить UI без записи голоса.
            </AppText>
          </View>

          <View style={[styles.assistantBlock, { backgroundColor: theme.backgroundColor, borderColor: theme.borderColor }]}>
            <AppText style={{ color: theme.mutedTextColor }}>Пол говорящего</AppText>
            <View style={styles.voiceOptions}>
              {[
                { key: 'auto', label: 'Auto' },
                { key: 'female', label: 'Female' },
                { key: 'male', label: 'Male' },
              ].map((option) => (
                <Pressable
                  key={`gender-${option.key}`}
                  onPress={() => setVoiceGender(option.key as SpeechGender)}
                  style={[
                    styles.voiceButton,
                    {
                      backgroundColor: voiceGender === option.key ? theme.primaryColor : theme.cardColor,
                      borderColor: theme.borderColor,
                    },
                  ]}>
                  <AppText style={{ color: voiceGender === option.key ? theme.onPrimaryColor : theme.textColor }}>
                    {option.label}
                  </AppText>
                </Pressable>
              ))}
            </View>
            <AppText style={{ color: theme.mutedTextColor, fontSize: 13 }}>
              {availableVoices.length ? 'Выбор зависит от доступных голосов устройства.' : 'Голоса устройства не найдены, используется системный.'}
            </AppText>
          </View>

          <View style={[styles.assistantBlock, { backgroundColor: theme.backgroundColor, borderColor: theme.borderColor }]}>
            <AppText style={{ color: theme.mutedTextColor }}>Скорость голоса</AppText>
            <View style={styles.voiceOptions}>
              {[0.85, 1, 1.15].map((option) => (
                <Pressable
                  key={`rate-${option}`}
                  onPress={() => setVoiceRate(option)}
                  style={[
                    styles.voiceButton,
                    {
                      backgroundColor: voiceRate === option ? theme.primaryColor : theme.cardColor,
                      borderColor: theme.borderColor,
                    },
                  ]}>
                  <AppText style={{ color: voiceRate === option ? theme.onPrimaryColor : theme.textColor }}>
                    {option === 1 ? 'Normal' : option < 1 ? 'Slow' : 'Fast'}
                  </AppText>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={[styles.assistantBlock, { backgroundColor: theme.backgroundColor, borderColor: theme.borderColor }]}>
            <AppText style={{ color: theme.mutedTextColor }}>Тон голоса</AppText>
            <View style={styles.voiceOptions}>
              {[0.9, 1, 1.1].map((option) => (
                <Pressable
                  key={`pitch-${option}`}
                  onPress={() => setVoicePitch(option)}
                  style={[
                    styles.voiceButton,
                    {
                      backgroundColor: voicePitch === option ? theme.primaryColor : theme.cardColor,
                      borderColor: theme.borderColor,
                    },
                  ]}>
                  <AppText style={{ color: voicePitch === option ? theme.onPrimaryColor : theme.textColor }}>
                    {option === 1 ? 'Normal' : option < 1 ? 'Low' : 'High'}
                  </AppText>
                </Pressable>
              ))}
            </View>
          </View>
        </View>
      </AppBottomModal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  headerMenuButton: {
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 4,
    minHeight: 36,
    minWidth: 36,
  },
  list: {
    flex: 1,
    paddingHorizontal: 20,
  },
  listAnimated: {
    flex: 1,
  },
  listContent: {
    flexGrow: 1,
    justifyContent: 'flex-end',
    paddingBottom: 12,
    paddingTop: 12,
  },
  emptyListContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingBottom: 12,
    paddingTop: 12,
  },
  emptyState: {
    gap: 14,
    width: '100%',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  prompts: {
    gap: 10,
  },
  promptButton: {
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  loaderWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
  },
  errorWrap: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  errorText: {
    fontSize: 13,
    textAlign: 'center',
  },
  menuOverlay: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  menu: {
    borderRadius: 12,
    borderWidth: 1,
    gap: 2,
    minWidth: 170,
    padding: 8,
    position: 'absolute',
    right: 20,
    top: 52,
  },
  menuItem: {
    alignItems: 'center',
    borderRadius: 10,
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  composerSafeArea: {
    paddingBottom: 8,
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  composerAnimated: {
    width: '100%',
  },
  modalCenter: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  historyList: {
    gap: 10,
    paddingBottom: 20,
  },
  historyItem: {
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  historyBody: {
    flex: 1,
    gap: 2,
  },
  scoreContent: {
    gap: 12,
    paddingBottom: 16,
  },
  scoreBlock: {
    borderRadius: 14,
    borderWidth: 1,
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  headerAssistant: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  headerAssistantAvatar: {
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: 1,
    height: 24,
    justifyContent: 'center',
    width: 24,
  },
  headerAssistantText: {
    fontSize: 16,
    fontWeight: '700',
  },
  assistantSettingsContent: {
    gap: 12,
  },
  assistantHeaderCard: {
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  assistantAvatarLarge: {
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: 1,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  assistantBlock: {
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  rowBetween: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  voiceOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  voiceButton: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
});
