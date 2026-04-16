import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { AppBottomModal } from '@/components/ui/app-bottom-modal';
import { AppText } from '@/components/ui/app-text';
import { ScreenContainer } from '@/components/ui/screen-container';
import { buildAiUrl } from '@/constants/ai-config';
import { useAuth } from '@/providers/auth-provider';
import { useAppTheme } from '@/providers/theme-provider';

type ChatSummary = {
  id: number;
  user_id: number;
  title: string;
};

type ChatsResponse = {
  chats: ChatSummary[];
};

export default function ChatScreen() {
  const { theme } = useAppTheme();
  const { authFetch } = useAuth();
  const router = useRouter();

  const [menuOpen, setMenuOpen] = useState(false);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [historyChats, setHistoryChats] = useState<ChatSummary[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);

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

  const loadChatsHistory = useCallback(async () => {
    setIsLoadingHistory(true);
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
      setIsLoadingHistory(false);
    }
  }, [authFetch, readErrorMessage]);

  const handleOpenHistory = () => {
    setMenuOpen(false);
    setHistoryModalOpen(true);
    void loadChatsHistory();
  };

  const handleNewChat = () => {
    setMenuOpen(false);
    router.push('/chat-room');
  };

  const handleHistoryItemPress = (chatId: number) => {
    setHistoryModalOpen(false);
    router.push({
      pathname: '/chat-room',
      params: { chatId: String(chatId) },
    });
  };

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <AppText style={[styles.title, { color: theme.textColor }]}>Чаты</AppText>
        <Pressable
          onPress={() => setMenuOpen((current) => !current)}
          style={[styles.menuButton, { backgroundColor: theme.cardColor, borderColor: theme.borderColor }]}>
          <Ionicons name="ellipsis-vertical" size={18} color={theme.textColor} />
        </Pressable>
      </View>

      <View style={[styles.card, { backgroundColor: theme.cardColor, borderColor: theme.borderColor }]}> 
        <AppText style={[styles.text, { color: theme.mutedTextColor }]}> 
          Здесь у нас чаты. Вы можете практиковать английский, обсуждать интересные темы и вести
          несколько диалогов параллельно.
        </AppText>
      </View>

      <View style={styles.quickActions}>
        <Pressable
          onPress={handleOpenHistory}
          style={[styles.quickActionButton, { backgroundColor: theme.cardColor, borderColor: theme.borderColor }]}>
          <Ionicons name="time-outline" size={16} color={theme.textColor} />
          <AppText style={{ color: theme.textColor }}>История</AppText>
        </Pressable>
        <Pressable
          onPress={handleNewChat}
          style={[styles.quickActionButton, { backgroundColor: theme.cardColor, borderColor: theme.borderColor }]}>
          <Ionicons name="add-circle-outline" size={16} color={theme.textColor} />
          <AppText style={{ color: theme.textColor }}>Новый чат</AppText>
        </Pressable>
      </View>

      {menuOpen ? (
        <Pressable style={styles.menuOverlay} onPress={() => setMenuOpen(false)}>
          <View style={[styles.menu, { backgroundColor: theme.cardColor, borderColor: theme.borderColor }]}> 
            <Pressable style={styles.menuItem} onPress={handleOpenHistory}>
              <Ionicons name="time-outline" size={18} color={theme.textColor} />
              <AppText style={{ color: theme.textColor }}>История</AppText>
            </Pressable>
            <Pressable style={styles.menuItem} onPress={handleNewChat}>
              <Ionicons name="add-circle-outline" size={18} color={theme.textColor} />
              <AppText style={{ color: theme.textColor }}>Новый чат</AppText>
            </Pressable>
          </View>
        </Pressable>
      ) : null}

      <AppBottomModal isOpen={historyModalOpen} onClose={() => setHistoryModalOpen(false)} title="История чатов" scrollable>
        {isLoadingHistory ? (
          <View style={styles.modalCenter}>
            <ActivityIndicator size="small" color={theme.primaryColor} />
          </View>
        ) : historyError ? (
          <View style={styles.modalCenter}>
            <AppText style={{ color: '#EF4444', textAlign: 'center' }}>{historyError}</AppText>
          </View>
        ) : (
          <View style={historyChats.length ? styles.historyList : styles.modalCenter}>
            {historyChats.length ? (
              historyChats.map((item) => (
              <Pressable
                key={item.id}
                onPress={() => handleHistoryItemPress(item.id)}
                style={[styles.historyItem, { backgroundColor: theme.backgroundColor, borderColor: theme.borderColor }]}>
                <View style={styles.historyBody}>
                  <AppText style={{ color: theme.textColor, fontWeight: '700' }}>
                    {item.title || `Chat #${item.id}`}
                  </AppText>
                  <AppText style={{ color: theme.mutedTextColor }}>ID: {item.id}</AppText>
                </View>
                <Ionicons name="chevron-forward" size={18} color={theme.mutedTextColor} />
              </Pressable>
              ))
            ) : (
              <AppText style={{ color: theme.mutedTextColor }}>История чатов пуста</AppText>
            )}
          </View>
        )}
      </AppBottomModal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
  },
  menuButton: {
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: 1,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  card: {
    borderRadius: 18,
    borderWidth: 1,
    gap: 10,
    marginTop: 10,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  text: {
    fontSize: 16,
    lineHeight: 23,
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
    right: 0,
    top: 48,
  },
  menuItem: {
    alignItems: 'center',
    borderRadius: 10,
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 10,
    paddingVertical: 10,
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
  quickActions: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'center',
    marginTop: 14,
  },
  quickActionButton: {
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
});
