import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Image } from 'react-native';
import { useState } from 'react';
import { Stack, router } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/ui/Card';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Spacing, BorderRadius } from '@/constants/colors';
import { Typography } from '@/constants/typography';
import { Ionicons } from '@expo/vector-icons';
import { userApi } from '@/services/api/user';
import * as ImagePicker from 'expo-image-picker';

export default function ProfileEditScreen() {
  const { colors } = useTheme();
  const { user, fetchUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  
  const [formData, setFormData] = useState({
    full_name: user?.full_name || '',
    phone: user?.phone || '',
  });

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please allow access to your photo library');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      await uploadAvatar(result.assets[0].uri);
    }
  };

  const uploadAvatar = async (uri: string) => {
    setUploadingAvatar(true);
    try {
      const formData = new FormData();
      const filename = uri.split('/').pop() || 'avatar.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';

      formData.append('file', {
        uri,
        name: filename,
        type,
      } as any);

      await userApi.uploadAvatar(formData);
      await fetchUser();
      Alert.alert('Success', 'Avatar uploaded successfully');
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to upload avatar');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await userApi.updateMe({
        full_name: formData.full_name,
        phone: formData.phone,
      });
      
      await fetchUser();
      Alert.alert('Success', 'Profile updated successfully', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = () => {
    router.push('/settings/change-password');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          title: 'Edit Profile',
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.text,
        }}
      />

      <ScrollView style={styles.content}>
        {/* Avatar Section */}
        <Card style={styles.avatarCard}>
          <View style={styles.avatarSection}>
            {user?.avatar_url ? (
              <Image
                source={{ uri: user.avatar_url }}
                style={styles.avatarImage}
              />
            ) : (
              <View style={[styles.avatarPlaceholder, { backgroundColor: colors.primary }]}>
                <Text style={styles.avatarText}>
                  {user?.full_name?.charAt(0).toUpperCase() || user?.email.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
            
            <TouchableOpacity
              style={[styles.changeAvatarButton, { backgroundColor: colors.primary }]}
              onPress={handlePickImage}
              disabled={uploadingAvatar}
            >
              {uploadingAvatar ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Ionicons name="camera" size={20} color="#FFFFFF" />
              )}
            </TouchableOpacity>
          </View>
          
          <Text style={[styles.avatarHint, { color: colors.textSecondary }]}>
            Tap the camera icon to change your avatar
          </Text>
        </Card>

        {/* Personal Information */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
          PERSONAL INFORMATION
        </Text>

        <Card style={styles.formCard}>
          <FormField label="Full Name">
            <Input
              value={formData.full_name}
              onChangeText={(text) => setFormData({ ...formData, full_name: text })}
              placeholder="Enter your full name"
            />
          </FormField>

          <FormField label="Email">
            <Input
              value={user?.email || ''}
              editable={false}
              placeholder="Email address"
              style={styles.disabledField}
            />
          </FormField>

          <FormField label="Phone">
            <Input
              value={formData.phone}
              onChangeText={(text) => setFormData({ ...formData, phone: text })}
              placeholder="Enter your phone number"
              keyboardType="phone-pad"
            />
          </FormField>
        </Card>

        {/* Security */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
          SECURITY
        </Text>

        <Card style={styles.section}>
          <TouchableOpacity style={styles.settingItem} onPress={handleChangePassword}>
            <View style={[styles.iconContainer, { backgroundColor: colors.primaryLight + '20' }]}>
              <Ionicons name="key-outline" size={20} color={colors.primary} />
            </View>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingTitle, { color: colors.text }]}>
                Change Password
              </Text>
              <Text style={[styles.settingSubtitle, { color: colors.textSecondary }]}>
                Update your password
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
          </TouchableOpacity>
        </Card>

        {/* Save Button */}
        <Button
          title="Save Changes"
          onPress={handleSave}
          loading={isLoading}
          style={styles.saveButton}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: Spacing.md,
  },
  avatarCard: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    marginBottom: Spacing.md,
  },
  avatarSection: {
    position: 'relative',
    marginBottom: Spacing.sm,
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: BorderRadius.full,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 40,
    fontWeight: Typography.weights.bold,
    color: '#FFFFFF',
  },
  changeAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  avatarHint: {
    fontSize: Typography.sizes.sm,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.semibold,
    letterSpacing: 0.5,
    marginBottom: Spacing.sm,
    marginTop: Spacing.md,
  },
  formCard: {
    marginBottom: Spacing.md,
  },
  disabledField: {
    opacity: 0.6,
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
  saveButton: {
    marginTop: Spacing.md,
    marginBottom: Spacing.xl,
  },
});
