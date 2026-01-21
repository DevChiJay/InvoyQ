import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { useClient, useUpdateClient } from '@/hooks/useClients';
import { FormField, Input, TextArea, Button } from '@/components/ui';
import { validateForm, hasErrors, sanitizeFormData, formatFormData, getFieldError } from '@/utils/formHelpers';
import { clientSchema } from '@/utils/validation';
import { showError } from '@/utils/alerts';

export default function EditClientScreen() {
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: client, isLoading } = useClient(id);
  const updateClient = useUpdateClient();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Pre-populate form when client data loads
  useEffect(() => {
    if (client) {
      setFormData({
        name: client.name || '',
        email: client.email || '',
        phone: client.phone || '',
        address: client.address || '',
      });
    }
  }, [client]);

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
      
      await updateClient.mutateAsync({ id, data: formatted });
      router.back();
    } catch (error: any) {
      showError(error.response?.data?.detail || 'Failed to update client');
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!client) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.textSecondary }]}>Client not found</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          title: 'Edit Client',
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.text,
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          ),
        }}
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
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

      <View style={[styles.footer, { borderTopColor: colors.border }]}>
        <Button
          title="Cancel"
          onPress={() => router.back()}
          variant="outline"
          style={styles.button}
        />
        <Button
          title={updateClient.isPending ? 'Saving...' : 'Save Changes'}
          onPress={handleSubmit}
          variant="primary"
          disabled={updateClient.isPending}
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
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
  },
  button: {
    flex: 1,
  },
  errorText: {
    fontSize: 16,
  },
});
