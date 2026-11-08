import { Stack } from "expo-router";
import { ModuleStack } from "@/components/navigation/ModuleStack";

export default function ClientsLayout() {
  return (
    <ModuleStack basePath="/clients">
      <Stack.Screen name="index" options={{ headerShown: true }} />
      <Stack.Screen name="create" options={{ headerShown: true }} />
      <Stack.Screen name="[id]" options={{ headerShown: true }} />
      <Stack.Screen name="edit/[id]" options={{ headerShown: true }} />
    </ModuleStack>
  );
}
