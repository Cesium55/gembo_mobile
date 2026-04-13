import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';

import { SettingsHeaderButton } from '@/components/profile/settings-header-button';
import { AppText } from '@/components/ui/app-text';
import { ScreenContainer } from '@/components/ui/screen-container';
import { useAuth } from '@/providers/auth-provider';
import { useAppTheme } from '@/providers/theme-provider';

type UserProfile = {
  id: number;
  email: string;
  name: string | null;
  google_photo_url: string | null;
};

export default function ProfileScreen() {
  const { theme } = useAppTheme();
  const { authFetch, logout } = useAuth();
  const [user, setUser] = useState<UserProfile | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadProfile = async () => {
      try {
        const response = await authFetch('/auth', { method: 'GET' });
        if (!response.ok) {
          return;
        }

        const data = (await response.json()) as { user?: UserProfile };
        if (isMounted) {
          setUser(data.user ?? null);
        }
      } catch {
        if (isMounted) {
          setUser(null);
        }
      }
    };

    loadProfile();

    return () => {
      isMounted = false;
    };
  }, [authFetch]);

  const displayName = user?.name?.trim() ? user.name : user?.id !== undefined ? `User ${user.id}` : user?.email ?? '';
  const photoUrl = user?.google_photo_url?.trim() ? user.google_photo_url : null;

  return (
    <ScreenContainer>
      <View style={styles.topBar}>
        <SettingsHeaderButton color={theme.textColor} />
      </View>

      <View style={styles.content}>
        <View style={[styles.profileCard, { backgroundColor: theme.cardColor, borderColor: theme.borderColor }]}>
          {photoUrl ? (
            <Image source={{ uri: photoUrl }} style={styles.avatarImage} contentFit="cover" />
          ) : (
            <View style={[styles.avatarFallback, { borderColor: theme.borderColor, backgroundColor: theme.backgroundColor }]}>
              <Ionicons name="person-outline" size={24} color={theme.textColor} />
            </View>
          )}

          <View style={styles.userInfo}>
            <AppText style={{ color: theme.textColor, fontWeight: '700' }}>{displayName || 'Профиль'}</AppText>
            {user?.email ? <AppText style={{ color: theme.mutedTextColor }}>{user.email}</AppText> : null}
          </View>
        </View>
      </View>
      <View style={styles.bottomActions}>
        <Pressable onPress={logout} style={[styles.logoutButton, { backgroundColor: theme.cardColor, borderColor: theme.borderColor }]}>
          <AppText style={{ color: theme.textColor }}>Выйти</AppText>
        </Pressable>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  topBar: {
    alignItems: 'flex-end',
  },
  content: {
    gap: 12,
    marginTop: 6,
  },
  bottomActions: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  profileCard: {
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  avatarImage: {
    borderRadius: 22,
    height: 44,
    width: 44,
  },
  avatarFallback: {
    alignItems: 'center',
    borderRadius: 22,
    borderWidth: 1,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  userInfo: {
    flex: 1,
    gap: 2,
  },
  logoutButton: {
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
});
