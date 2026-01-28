import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Image, Linking } from 'react-native';
import { Stack, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Updates from 'expo-updates';
import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Spacing, BorderRadius } from '@/constants/colors';
import { Typography } from '@/constants/typography';
import { Ionicons } from '@expo/vector-icons';

export default function SettingsScreen() {
  const { user, logout } = useAuth();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [isChecking, setIsChecking] = useState(false);
  const [updateMessage, setUpdateMessage] = useState<string | null>(null);

  const {
    currentlyRunning,
    isUpdateAvailable,
    isUpdatePending
  } = Updates.useUpdates();

  useEffect(() => {
    if (isUpdatePending) {
      // Update has successfully downloaded; apply it now
      Alert.alert(
        'Update Ready',
        'A new update has been downloaded. The app will restart to apply the update.',
        [
          { text: 'OK', onPress: () => Updates.reloadAsync() }
        ]
      );
    }
  }, [isUpdatePending]);

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: () => logout() },
      ]
    );
  };

  const handleCheckForUpdates = async () => {
    // Updates are only available in production builds, not in Expo Go or development
    if (!Updates.isEnabled) {
      Alert.alert(
        'Updates Not Available',
        'App updates are only available in production builds. This feature is disabled in development mode.',
        [{ text: 'OK' }]
      );
      return;
    }

    try {
      setIsChecking(true);
      setUpdateMessage(null);
      
      const update = await Updates.checkForUpdateAsync();
      
      if (update.isAvailable) {
        setUpdateMessage('Downloading update...');
        await Updates.fetchUpdateAsync();
        setUpdateMessage('Update downloaded! Restarting...');
      } else {
        setUpdateMessage('You are already on the latest version!');
        setTimeout(() => setUpdateMessage(null), 3000);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Update check error:', error);
      Alert.alert(
        'Update Error',
        `Failed to check for updates: ${errorMessage}`,
        [{ text: 'OK' }]
      );
      setUpdateMessage(null);
    } finally {
      setIsChecking(false);
    }
  };

  const handleProfilePress = () => {
    router.push('/settings/profile');
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[
        styles.content,
        { paddingBottom: Math.max(insets.bottom + 80, 100) }
      ]}
    >
      <Stack.Screen
        options={{
          title: 'Settings',
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.text,
        }}
      />
      {/* User Profile Card */}
      <TouchableOpacity onPress={handleProfilePress}>
        <Card variant="elevated" style={styles.profileCard}>
          <View style={styles.profileHeader}>
            {user?.avatar_url ? (
              <Image
                source={{ uri: user.avatar_url }}
                style={styles.avatarImage}
              />
            ) : (
              <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
                <Text style={styles.avatarText}>
                  {user?.full_name?.charAt(0).toUpperCase() || user?.email.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
            <View style={styles.profileInfo}>
              <Text style={[styles.userName, { color: colors.text }]}>
                {user?.full_name || 'User'}
              </Text>
              <Text style={[styles.userEmail, { color: colors.textSecondary }]}>
                {user?.email}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
          </View>
        </Card>
      </TouchableOpacity>

      {/* Settings Sections */}
      <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
        ACCOUNT
      </Text>

      <Card variant="elevated" style={styles.section}>
        <SettingItem
          icon="person-outline"
          title="Profile"
          subtitle="Update your personal information"
          onPress={() => router.push('/settings/profile')}
          colors={colors}
        />
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <SettingItem
          icon="business-outline"
          title="Business Info"
          subtitle="Company details and branding"
          onPress={() => router.push('/settings/business')}
          colors={colors}
        />
      </Card>

      <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
        APP
      </Text>

      <Card variant="elevated" style={styles.section}>
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <SettingItem
          icon="moon-outline"
          title="Dark Mode"
          subtitle="Toggle dark mode"
          onPress={() => {}}
          colors={colors}
        />
      </Card>

      <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
        SUPPORT
      </Text>

      <Card variant="elevated" style={styles.section}>
        <SettingItem
          icon="help-circle-outline"
          title="Help Center"
          subtitle="Get help and support"
          onPress={() => {}}
          colors={colors}
        />
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <SettingItem
          icon="document-text-outline"
          title="Privacy Policy"
          subtitle="Read our privacy policy"
          onPress={() => Linking.openURL(`${process.env.EXPO_PUBLIC_FRONTEND_URL}/privacy`)}
          colors={colors}
        />
      </Card>

      {/* Logout Button */}
      <Button
        title="Logout"
        onPress={handleLogout}
        variant="outline"
        style={styles.logoutButton}
      />

      {/* Update Check Section */}
      <Card variant="elevated" style={styles.updateCard}>
        <View style={styles.updateContent}>
          <View style={styles.updateHeader}>
            <Ionicons name="sync-outline" size={24} color={colors.primary} />
            <View style={styles.updateInfo}>
              <Text style={[styles.updateTitle, { color: colors.text }]}>
                App Updates
              </Text>
              <Text style={[styles.updateSubtitle, { color: colors.textSecondary }]}>
                {currentlyRunning.isEmbeddedLaunch
                  ? 'Running built-in version'
                  : 'Running updated version'}
              </Text>
            </View>
          </View>
          
          {updateMessage && (
            <View style={[styles.updateMessageContainer, { backgroundColor: colors.primaryLight + '20' }]}>
              <Text style={[styles.updateMessage, { color: colors.primary }]}>
                {updateMessage}
              </Text>
            </View>
          )}
          
          <Button
            title={isChecking ? "Checking..." : "Check for Updates"}
            onPress={handleCheckForUpdates}
            variant="primary"
            style={styles.updateButton}
            disabled={isChecking}
          />
        </View>
      </Card>

      <Text style={[styles.version, { color: colors.textTertiary }]}>
        Version 1.0.0
      </Text>
    </ScrollView>
  );
}

interface SettingItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  onPress: () => void;
  colors: any;
}

function SettingItem({ icon, title, subtitle, onPress, colors }: SettingItemProps) {
  return (
    <TouchableOpacity style={styles.settingItem} onPress={onPress}>
      <View style={[styles.iconContainer, { backgroundColor: colors.primaryLight + '20' }]}>
        <Ionicons name={icon} size={20} color={colors.primary} />
      </View>
      <View style={styles.settingInfo}>
        <Text style={[styles.settingTitle, { color: colors.text }]}>
          {title}
        </Text>
        <Text style={[styles.settingSubtitle, { color: colors.textSecondary }]}>
          {subtitle}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: Spacing.md,
  },
  profileCard: {
    marginBottom: Spacing.lg,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarImage: {
    width: 64,
    height: 64,
    borderRadius: BorderRadius.full,
    marginRight: Spacing.md,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  avatarText: {
    fontSize: Typography.sizes['2xl'],
    fontWeight: Typography.weights.bold,
    color: '#FFFFFF',
  },
  profileInfo: {
    flex: 1,
  },
  userName: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.semibold,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: Typography.sizes.sm,
  },
  sectionTitle: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.semibold,
    letterSpacing: 0.5,
    marginBottom: Spacing.sm,
    marginTop: Spacing.md,
  },
  section: {
    marginBottom: Spacing.md,
    padding: 0,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  settingInfo: {
    flex: 1,
  },
  settingTitle: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.medium,
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: Typography.sizes.sm,
  },
  divider: {
    height: 1,
    marginHorizontal: Spacing.md,
  },
  logoutButton: {
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
  },
  updateCard: {
    marginBottom: Spacing.md,
  },
  updateContent: {
    padding: Spacing.md,
  },
  updateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  updateInfo: {
    marginLeft: Spacing.sm,
    flex: 1,
  },
  updateTitle: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
    marginBottom: 2,
  },
  updateSubtitle: {
    fontSize: Typography.sizes.sm,
  },
  updateMessageContainer: {
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.md,
  },
  updateMessage: {
    fontSize: Typography.sizes.sm,
    textAlign: 'center',
  },
  updateButton: {
    width: '100%',
  },
  version: {
    fontSize: Typography.sizes.sm,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
});
