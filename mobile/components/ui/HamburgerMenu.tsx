import { View, Text, StyleSheet, TouchableOpacity, Modal, Image, Animated } from 'react-native';
import { useState, useEffect, useRef } from 'react';
import { router } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { Ionicons } from '@expo/vector-icons';
import { Spacing, BorderRadius, MIN_TOUCH_TARGET } from '@/constants/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Typography } from '@/constants/typography';

export function HamburgerMenu() {
  const [visible, setVisible] = useState(false);
  const { user, logout } = useAuth();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(-300)).current;

  useEffect(() => {
    if (visible) {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: -300,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const handleNavigation = (path: string) => {
    setVisible(false);
    setTimeout(() => router.push(path as any), 100);
  };

  const handleLogout = () => {
    setVisible(false);
    setTimeout(() => logout(), 100);
  };

  return (
    <>
      <TouchableOpacity 
        onPress={() => setVisible(true)} 
        style={[styles.menuButton, { backgroundColor: colors.surfaceVariant }]}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel="Open menu"
      >
        <Ionicons name="menu" size={24} color={colors.text} />
      </TouchableOpacity>

      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={() => setVisible(false)}
      >
        <TouchableOpacity 
          style={styles.overlay}
          activeOpacity={1}
          onPress={() => setVisible(false)}
        >
          <Animated.View 
            style={[
              styles.menuContainer, 
              {
                backgroundColor: colors.surfaceElevated,
                paddingTop: insets.top + Spacing.md,
                transform: [{ translateX: slideAnim }],
              },
            ]}
            onStartShouldSetResponder={() => true}
          >
            {/* Header with User Info */}
            <View style={styles.header}>
              <TouchableOpacity 
                style={styles.userInfo}
                onPress={() => handleNavigation('/(tabs)/settings/profile')}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel={`Profile, ${user?.full_name || user?.email || 'User'}`}
              >
                {user?.avatar_url ? (
                  <Image
                    source={{ uri: user.avatar_url }}
                    style={styles.avatar}
                  />
                ) : (
                  <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
                    <Text style={styles.avatarText}>
                      {user?.full_name?.charAt(0).toUpperCase() || user?.email.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                )}
                <View style={styles.userDetails}>
                  <Text style={[styles.userName, { color: colors.text }]} numberOfLines={1}>
                    {user?.full_name || 'User'}
                  </Text>
                  <Text style={[styles.userEmail, { color: colors.textSecondary }]} numberOfLines={1}>
                    {user?.email}
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity 
                onPress={() => handleNavigation('/(tabs)/settings')}
                style={[styles.settingsIcon, { backgroundColor: colors.surfaceVariant }]}
                accessibilityRole="button"
                accessibilityLabel="Settings"
              >
                <Ionicons name="settings-outline" size={20} color={colors.text} />
              </TouchableOpacity>
            </View>

            {/* Divider */}
            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            {/* Menu Items */}
            <View style={styles.menuItems}>
              <MenuItem
                icon="people-outline"
                label="Clients"
                onPress={() => handleNavigation('/(tabs)/clients')}
                colors={colors}
              />
              <MenuItem
                icon="receipt-outline"
                label="Expenses"
                onPress={() => handleNavigation('/(tabs)/expenses')}
                colors={colors}
              />
            </View>

            {/* Footer */}
            <View style={styles.footer}>
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              <TouchableOpacity 
                style={styles.logoutButton}
                onPress={handleLogout}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel="Log out"
              >
                <Ionicons name="log-out-outline" size={20} color={colors.errorText} />
                <Text style={[styles.logoutText, { color: colors.errorText }]}>Logout</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

interface MenuItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  colors: ReturnType<typeof useTheme>['colors'];
}

function MenuItem({ icon, label, onPress, colors }: MenuItemProps) {
  return (
    <TouchableOpacity
      style={styles.menuItem}
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <View style={[styles.iconContainer, { backgroundColor: colors.primarySoft }]}>
        <Ionicons name={icon} size={20} color={colors.primaryText} />
      </View>
      <Text style={[styles.menuItemText, { color: colors.text }]}>{label}</Text>
      <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  menuButton: {
    width: MIN_TOUCH_TARGET,
    height: MIN_TOUCH_TARGET,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: Spacing.sm,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
  },
  menuContainer: {
    width: 300,
    height: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: Typography.weights.bold,
    color: '#FFFFFF',
  },
  userDetails: {
    marginLeft: Spacing.sm,
    flex: 1,
  },
  userName: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
  },
  userEmail: {
    fontSize: Typography.sizes.sm,
    marginTop: 2,
  },
  settingsIcon: {
    width: MIN_TOUCH_TARGET,
    height: MIN_TOUCH_TARGET,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: Spacing.sm,
  },
  divider: {
    height: 1,
    marginVertical: Spacing.sm,
  },
  menuItems: {
    flex: 1,
    paddingTop: Spacing.sm,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  menuItemText: {
    flex: 1,
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.medium,
  },
  footer: {
    paddingBottom: Spacing.lg,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  logoutText: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.medium,
    marginLeft: Spacing.sm,
  },
});
