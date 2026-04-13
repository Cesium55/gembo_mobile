import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import { Pressable, StyleSheet } from 'react-native';

type SettingsHeaderButtonProps = {
  color: string;
};

export function SettingsHeaderButton({ color }: SettingsHeaderButtonProps) {
  return (
    <Link href="/settings" asChild>
      <Pressable style={styles.button} hitSlop={10}>
        <Ionicons name="settings-outline" size={22} color={color} />
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  button: {
    padding: 4,
  },
});
