import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { useState } from 'react';
import { Stack, router } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { Card } from '@/components/ui/Card';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Spacing } from '@/constants/colors';
import { Typography } from '@/constants/typography';
import { userApi } from '@/services/api/user';

export default function ChangePasswordScreen() {
  const { colors } = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const validateForm = (): boolean => {
    const newErrors = {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    };

    if (!formData.currentPassword) {
      newErrors.currentPassword = 'Current password is required';
    }

    if (!formData.newPassword) {
      newErrors.newPassword = 'New password is required';
    } else if (formData.newPassword.length < 6) {
      newErrors.newPassword = 'Password must be at least 6 characters';
    } else if (!/\d/.test(formData.newPassword)) {
      newErrors.newPassword = 'Password must contain at least 1 number';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return !Object.values(newErrors).some(error => error !== '');
  };

  const handleChangePassword = async () => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      await userApi.changePassword(formData.currentPassword, formData.newPassword);
      
      Alert.alert(
        'Success',
        'Your password has been changed successfully',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || 'Failed to change password';
      Alert.alert('Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          title: 'Change Password',
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.text,
        }}
      />

      <ScrollView style={styles.content}>
        <Text style={[styles.description, { color: colors.textSecondary }]}>
          Enter your current password and choose a new password. Make sure your new password is at least 6 characters long and contains at least 1 number.
        </Text>

        <Card style={styles.formCard}>
          <FormField label="Current Password" error={errors.currentPassword}>
            <Input
              value={formData.currentPassword}
              onChangeText={(text) => {
                setFormData({ ...formData, currentPassword: text });
                setErrors({ ...errors, currentPassword: '' });
              }}
              placeholder="Enter your current password"
              secureTextEntry
              error={!!errors.currentPassword}
            />
          </FormField>

          <FormField label="New Password" error={errors.newPassword}>
            <Input
              value={formData.newPassword}
              onChangeText={(text) => {
                setFormData({ ...formData, newPassword: text });
                setErrors({ ...errors, newPassword: '' });
              }}
              placeholder="Enter your new password"
              secureTextEntry
              error={!!errors.newPassword}
            />
          </FormField>

          <FormField label="Confirm New Password" error={errors.confirmPassword}>
            <Input
              value={formData.confirmPassword}
              onChangeText={(text) => {
                setFormData({ ...formData, confirmPassword: text });
                setErrors({ ...errors, confirmPassword: '' });
              }}
              placeholder="Confirm your new password"
              secureTextEntry
              error={!!errors.confirmPassword}
            />
          </FormField>
        </Card>

        <Button
          title="Change Password"
          onPress={handleChangePassword}
          loading={isLoading}
          style={styles.changeButton}
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
  description: {
    fontSize: Typography.sizes.sm,
    lineHeight: 20,
    marginBottom: Spacing.lg,
  },
  formCard: {
    marginBottom: Spacing.md,
  },
  changeButton: {
    marginTop: Spacing.md,
  },
});
