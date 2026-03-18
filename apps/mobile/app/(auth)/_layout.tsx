import { Stack } from "expo-router";
import { useAuth } from "@/lib/auth-context";
import { Redirect } from "expo-router";

export default function AuthLayout() {
  const { isSignedIn } = useAuth();

  if (isSignedIn) {
    return <Redirect href="/(tabs)" />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: "#1a1a2e" },
      }}
    />
  );
}
