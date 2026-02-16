import React from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  View,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useGoogleAuth } from "@/hooks/useGoogleAuth";
import { useTheme } from "@/hooks/useTheme";

interface GoogleSignInButtonProps {
  mode?: "login" | "register";
  onSuccess?: () => void;
  onError?: (error: any) => void;
}

export function GoogleSignInButton({
  mode = "login",
  onSuccess,
  onError,
}: GoogleSignInButtonProps) {
  const { signInWithGoogle, isLoading, isReady } = useGoogleAuth();
  const { colors } = useTheme();

  const handlePress = async () => {
    if (__DEV__) {
      console.log("Google Sign-In button pressed, mode:", mode);
    }

    const result = await signInWithGoogle();

    if (result.success && onSuccess) {
      onSuccess();
    } else if (!result.success && result.error && onError) {
      onError(result.error);
    }
  };

  const buttonText =
    mode === "login" ? "Continue with Google" : "Sign up with Google";

  return (
    <TouchableOpacity
      style={[
        styles.button,
        {
          backgroundColor: "rgba(255, 255, 255, 0.95)",
          borderColor: "rgba(0, 0, 0, 0.1)",
        },
      ]}
      onPress={handlePress}
      disabled={isLoading || !isReady}
      activeOpacity={0.7}
    >
      {isLoading ? (
        <ActivityIndicator size="small" color="#4285F4" />
      ) : (
        <>
          <View style={styles.iconContainer}>
            <Ionicons name="logo-google" size={20} color="#4285F4" />
          </View>
          <Text style={[styles.buttonText, { color: "#1F2937" }]}>
            {buttonText}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    marginVertical: 8,
    minHeight: 52,
  },
  iconContainer: {
    marginRight: 12,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
  },
});
