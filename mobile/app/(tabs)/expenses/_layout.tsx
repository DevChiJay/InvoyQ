import { Stack } from "expo-router";
import { ModuleStack } from "@/components/navigation/ModuleStack";

export default function ExpensesLayout() {
  return (
    <ModuleStack basePath="/expenses">
      <Stack.Screen name="index" options={{ headerShown: true }} />
      <Stack.Screen name="create" options={{ headerShown: true }} />
      <Stack.Screen name="[id]" options={{ headerShown: true }} />
      <Stack.Screen name="edit/[id]" options={{ headerShown: true }} />
    </ModuleStack>
  );
}
