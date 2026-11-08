import { Stack } from "expo-router";
import { ModuleStack } from "@/components/navigation/ModuleStack";

export default function SettingsLayout() {
  return (
    <ModuleStack>
      <Stack.Screen name="index" />
    </ModuleStack>
  );
}
