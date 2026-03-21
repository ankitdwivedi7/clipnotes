import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";

export default function ProfileScreen() {
  const { userEmail, signIn, signUp } = useAuth();
  const queryClient = useQueryClient();
  const [loggedOut, setLoggedOut] = useState(false);

  // --- Inline sign-in form state ---
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (loggedOut) {
    const handleSubmit = async () => {
      setLoading(true);
      setError("");
      try {
        if (isSignUp) {
          await signUp(email, password);
        } else {
          await signIn(email, password);
        }
        // Success - go back to profile view
        setLoggedOut(false);
        setEmail("");
        setPassword("");
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Authentication failed");
      } finally {
        setLoading(false);
      }
    };

    return (
      <View style={s.authContainer}>
        <Text style={s.title}>ClipNotes</Text>
        <Text style={s.subtitle}>
          {isSignUp ? "Create your account" : "Sign in to your account"}
        </Text>
        {error ? <Text style={s.error}>{error}</Text> : null}
        <TextInput
          style={s.input}
          placeholder="Email"
          placeholderTextColor="#666"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <TextInput
          style={s.input}
          placeholder="Password"
          placeholderTextColor="#666"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        <TouchableOpacity
          style={s.button}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={s.buttonText}>
              {isSignUp ? "Sign Up" : "Sign In"}
            </Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={s.link}
          onPress={() => {
            setIsSignUp(!isSignUp);
            setError("");
          }}
        >
          <Text style={s.linkText}>
            {isSignUp ? "Already have an account? " : "Don't have an account? "}
            <Text style={s.accent}>{isSignUp ? "Sign In" : "Sign Up"}</Text>
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.label}>EMAIL</Text>
        <Text style={styles.email}>{userEmail || "Unknown"}</Text>
      </View>

      <View style={styles.buttonWrapper}>
        <Button
          title="Log Out"
          color="#dc2626"
          onPress={() => {
            Alert.alert("Log Out", "Are you sure?", [
              { text: "Cancel", style: "cancel" },
              {
                text: "Log Out",
                style: "destructive",
                onPress: () => {
                  // Clear all stored data
                  AsyncStorage.clear().catch(() => {});
                  // Clear react-query cache
                  queryClient.clear();
                  // Show login form
                  setLoggedOut(true);
                },
              },
            ]);
          }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f0f23",
    padding: 20,
    paddingTop: 60,
  },
  card: {
    backgroundColor: "#1a1a2e",
    borderRadius: 12,
    padding: 20,
    marginBottom: 30,
  },
  label: {
    color: "#888",
    fontSize: 13,
    marginBottom: 6,
  },
  email: {
    color: "#fff",
    fontSize: 17,
  },
  buttonWrapper: {
    marginTop: 20,
  },
});

const s = StyleSheet.create({
  authContainer: {
    flex: 1,
    backgroundColor: "#1a1a2e",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  title: { color: "#fff", fontSize: 30, fontWeight: "bold", marginBottom: 8 },
  subtitle: { color: "#999", fontSize: 18, marginBottom: 32 },
  error: { color: "#e94560", marginBottom: 16 },
  input: {
    backgroundColor: "#16213e",
    color: "#fff",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 10,
    marginBottom: 16,
    fontSize: 16,
  },
  button: {
    backgroundColor: "#6366f1",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 16,
  },
  buttonText: { color: "#fff", fontWeight: "600", fontSize: 18 },
  link: { alignItems: "center" },
  linkText: { color: "#999" },
  accent: { color: "#6366f1" },
});
