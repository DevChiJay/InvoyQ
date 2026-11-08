import { Stack } from "expo-router";
import { HeaderBackButton, ModuleStack } from "@/components/navigation/ModuleStack";

export default function StatsLayout() {
  return (
    <ModuleStack initialRouteName="monthly">
      <Stack.Screen
        name="monthly"
        options={{
          title: "Monthly Statistics",
          headerShown: true,
          // `monthly` is the root of this stack, so show the back button even
          // though the stack itself has nothing to pop.
          headerLeft: () => <HeaderBackButton />,
        }}
      />
    </ModuleStack>
  );
}
