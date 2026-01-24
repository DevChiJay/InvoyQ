import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { Stack, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';
import { useCreateClient } from '@/hooks/useClients';
import { FormField, Input, TextArea, Button } from '@/components/ui';
import { validateForm, hasErrors, sanitizeFormData, formatFormData, getFieldError } from '@/utils/formHelpers';
import { clientSchema } from '@/utils/validation';
import { showError } from '@/utils/alerts';

export default function CreateClientScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const createClient = useCreateClient();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleSubmit = async () => {
    // Validate form
    const validationErrors = validateForm(clientSchema, formData);
    if (hasErrors(validationErrors)) {
      setErrors(validationErrors);
      return;
    }

    try {
      const sanitized = sanitizeFormData(formData);
      const formatted = formatFormData(sanitized);
      
      await createClient.mutateAsync(formatted);
      router.back();
    } catch (error: any) {
      showError(error.response?.data?.detail || 'Failed to create client');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          title: 'New Client',
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.text,
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          ),
        }}
      />  

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={100}
      >
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
        <FormField label="Name" required error={getFieldError(errors, 'name')}>
          <Input
            value={formData.name}
            onChangeText={(value) => handleChange('name', value)}
            placeholder="Enter client name"
            error={!!errors.name}
            autoCapitalize="words"
          />
        </FormField>

        <FormField label="Email" error={getFieldError(errors, 'email')}>
          <Input
            value={formData.email}
            onChangeText={(value) => handleChange('email', value)}
            placeholder="client@example.com"
            error={!!errors.email}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </FormField>

        <FormField label="Phone" error={getFieldError(errors, 'phone')}>
          <Input
            value={formData.phone}
            onChangeText={(value) => handleChange('phone', value)}
            placeholder="+234 123 456 7890"
            error={!!errors.phone}
            keyboardType="phone-pad"
          />
        </FormField>

        <FormField label="Address" error={getFieldError(errors, 'address')}>
          <TextArea
            value={formData.address}
            onChangeText={(value) => handleChange('address', value)}
            placeholder="Enter client address"
            error={!!errors.address}
            numberOfLines={4}
          />
        </FormField>
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={[styles.footer, { borderTopColor: colors.border, paddingBottom: Math.max(insets.bottom, 16) }]}>
        <Button
          title="Cancel"
          onPress={() => router.back()}
          variant="outline"
          style={styles.button}
        />
        <Button
          title={createClient.isPending ? 'Saving...' : 'Save Client'}
          onPress={handleSubmit}
          variant="primary"
          disabled={createClient.isPending}
          style={styles.button}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerButton: {
    padding: 8,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 12,
    borderTopWidth: 1,
  },
  button: {
    flex: 1,
  },
});
