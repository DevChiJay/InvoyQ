import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Image } from 'react-native';
import { useState } from 'react';
import { Stack, router } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Card } from '@/components/ui/Card';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { TextArea } from '@/components/ui/TextArea';
import { Button } from '@/components/ui/Button';
import { Spacing, BorderRadius } from '@/constants/colors';
import { Typography } from '@/constants/typography';
import { Ionicons } from '@expo/vector-icons';
import { userApi } from '@/services/api/user';
import * as ImagePicker from 'expo-image-picker';

export default function BusinessEditScreen() {
  const { colors } = useTheme();
  const { user, fetchUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
    const insets = useSafeAreaInsets();
  
  const [formData, setFormData] = useState({
    company_name: user?.company_name || '',
    company_address: user?.company_address || '',
    tax_id: user?.tax_id || '',
    website: user?.website || '',
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
      aspect: [16, 9],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      await uploadLogo(result.assets[0].uri);
    }
  };

  const uploadLogo = async (uri: string) => {
    setUploadingLogo(true);
    try {
      const formData = new FormData();
      const filename = uri.split('/').pop() || 'logo.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';

      formData.append('file', {
        uri,
        name: filename,
        type,
      } as any);

      await userApi.uploadLogo(formData);
      await fetchUser();
      Alert.alert('Success', 'Company logo uploaded successfully');
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to upload logo');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await userApi.updateMe({
        company_name: formData.company_name,
        company_address: formData.company_address,
        tax_id: formData.tax_id,
        website: formData.website,
      });
      
      await fetchUser();
      Alert.alert('Success', 'Business information updated successfully', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to update business information');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingBottom: Math.max(insets.bottom + 80, 100) }]}>
      <Stack.Screen
        options={{
          title: 'Business Info',
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.text,
        }}
      />

      <ScrollView style={styles.content}>
        {/* Logo Section */}
        <Card style={styles.logoCard}>
          <Text style={[styles.logoLabel, { color: colors.text }]}>Company Logo</Text>
          
          <View style={styles.logoSection}>
            {user?.company_logo_url ? (
              <Image
                source={{ uri: user.company_logo_url }}
                style={[styles.logoImage, { borderColor: colors.border }]}
                resizeMode="contain"
              />
            ) : (
              <View style={[styles.logoPlaceholder, { backgroundColor: colors.surfaceVariant, borderColor: colors.border }]}>
                <Ionicons name="business-outline" size={40} color={colors.textSecondary} />
                <Text style={[styles.logoPlaceholderText, { color: colors.textSecondary }]}>
                  No logo uploaded
                </Text>
              </View>
            )}
          </View>

          <Button
            title={uploadingLogo ? "Uploading..." : "Upload Logo"}
            onPress={handlePickImage}
            variant="outline"
            loading={uploadingLogo}
            style={styles.uploadButton}
            leftIcon={<Ionicons name="cloud-upload-outline" size={20} color={colors.primary} />}
          />
          
          <Text style={[styles.logoHint, { color: colors.textSecondary }]}>
            Recommended: 800x450px, PNG or JPG, max 5MB
          </Text>
        </Card>

        {/* Business Information */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
          COMPANY DETAILS
        </Text>

        <Card style={styles.formCard}>
          <FormField label="Company Name">
            <Input
              value={formData.company_name}
              onChangeText={(text) => setFormData({ ...formData, company_name: text })}
              placeholder="Enter your company name"
            />
          </FormField>

          <FormField label="Company Address">
            <TextArea
              value={formData.company_address}
              onChangeText={(text) => setFormData({ ...formData, company_address: text })}
              placeholder="Enter your company address"
              numberOfLines={3}
            />
          </FormField>

          <FormField label="Tax ID / VAT Number">
            <Input
              value={formData.tax_id}
              onChangeText={(text) => setFormData({ ...formData, tax_id: text })}
              placeholder="Enter your tax ID or VAT number"
            />
          </FormField>

          <FormField label="Website">
            <Input
              value={formData.website}
              onChangeText={(text) => setFormData({ ...formData, website: text })}
              placeholder="https://www.example.com"
              keyboardType="url"
              autoCapitalize="none"
            />
          </FormField>
        </Card>

        <Text style={[styles.infoText, { color: colors.textSecondary }]}>
          This information will appear on your invoices and other documents sent to clients.
        </Text>

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
  logoCard: {
    paddingVertical: Spacing.lg,
    marginBottom: Spacing.md,
  },
  logoLabel: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
    marginBottom: Spacing.md,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  logoImage: {
    width: 200,
    height: 100,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  logoPlaceholder: {
    width: 200,
    height: 100,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoPlaceholderText: {
    fontSize: Typography.sizes.sm,
    marginTop: Spacing.xs,
  },
  uploadButton: {
    marginBottom: Spacing.xs,
  },
  logoHint: {
    fontSize: Typography.sizes.xs,
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
  infoText: {
    fontSize: Typography.sizes.sm,
    lineHeight: 20,
    marginBottom: Spacing.md,
  },
  saveButton: {
    marginTop: Spacing.md,
    marginBottom: Spacing.xl,
  },
});
