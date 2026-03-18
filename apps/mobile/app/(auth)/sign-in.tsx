import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { useAuth } from "@/lib/auth-context";
import { useRouter, Link } from "expo-router";

export default function SignIn() {
  const { signIn } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    setLoading(true);
    setError("");
    try {
      await signIn(email, password);
      router.replace("/(tabs)");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Sign in failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={s.container}>
      <Text style={s.title}>ClipNotes</Text>
      <Text style={s.subtitle}>Sign in to your account</Text>
      {error ? <Text style={s.error}>{error}</Text> : null}
      <TextInput style={s.input} placeholder="Email" placeholderTextColor="#666" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
      <TextInput style={s.input} placeholder="Password" placeholderTextColor="#666" value={password} onChangeText={setPassword} secureTextEntry />
      <TouchableOpacity style={s.button} onPress={handleSignIn} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.buttonText}>Sign In</Text>}
      </TouchableOpacity>
      <Link href="/(auth)/sign-up" asChild>
        <TouchableOpacity style={s.link}>
          <Text style={s.linkText}>Don't have an account? <Text style={s.accent}>Sign Up</Text></Text>
        </TouchableOpacity>
      </Link>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#1a1a2e", justifyContent: "center", paddingHorizontal: 24 },
  title: { color: "#fff", fontSize: 30, fontWeight: "bold", marginBottom: 8 },
  subtitle: { color: "#999", fontSize: 18, marginBottom: 32 },
  error: { color: "#e94560", marginBottom: 16 },
  input: { backgroundColor: "#16213e", color: "#fff", paddingHorizontal: 16, paddingVertical: 14, borderRadius: 10, marginBottom: 16, fontSize: 16 },
  button: { backgroundColor: "#6366f1", paddingVertical: 14, borderRadius: 10, alignItems: "center", marginBottom: 16 },
  buttonText: { color: "#fff", fontWeight: "600", fontSize: 18 },
  link: { alignItems: "center" },
  linkText: { color: "#999" },
  accent: { color: "#6366f1" },
});
