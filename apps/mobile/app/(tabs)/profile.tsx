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

type Mode = "signIn" | "signUp" | "forgotPassword";

export default function ProfileScreen() {
  const { userEmail, signIn, signUp, resetPassword } = useAuth();
  const queryClient = useQueryClient();
  const [loggedOut, setLoggedOut] = useState(false);

  // --- Inline auth form state ---
  const [mode, setMode] = useState<Mode>("signIn");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const switchMode = (newMode: Mode) => {
    setMode(newMode);
    setError("");
    setPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  if (loggedOut) {
    const handleSubmit = async () => {
      setLoading(true);
      setError("");
      try {
        if (mode === "signUp") {
          await signUp(email, password);
        } else if (mode === "forgotPassword") {
          if (!email) { setError("Please enter your email"); return; }
          if (newPassword.length < 6) { setError("Password must be at least 6 characters"); return; }
          if (newPassword !== confirmPassword) { setError("Passwords do not match"); return; }
          await resetPassword(email, newPassword);
          Alert.alert("Success", "Your password has been reset and you are now signed in.");
        } else {
          await signIn(email, password);
        }
        setLoggedOut(false);
        setEmail("");
        setPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      } finally {
        setLoading(false);
      }
    };

    const title =
      mode === "signUp"
        ? "Create your account"
        : mode === "forgotPassword"
          ? "Reset your password"
          : "Sign in to your account";

    const buttonLabel =
      mode === "signUp"
        ? "Sign Up"
        : mode === "forgotPassword"
          ? "Reset Password"
          : "Sign In";

    return (
      <View style={s.authContainer}>
        <Text style={s.title}>ClipNotes</Text>
        <Text style={s.subtitle}>{title}</Text>
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

        {mode === "forgotPassword" ? (
          <>
            <TextInput
              style={s.input}
              placeholder="New Password"
              placeholderTextColor="#666"
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
            />
            <TextInput
              style={s.input}
              placeholder="Confirm New Password"
              placeholderTextColor="#666"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
            />
          </>
        ) : (
          <TextInput
            style={s.input}
            placeholder="Password"
            placeholderTextColor="#666"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
        )}

        <TouchableOpacity style={s.button} onPress={handleSubmit} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={s.buttonText}>{buttonLabel}</Text>
          )}
        </TouchableOpacity>

        {mode === "signIn" && (
          <>
            <TouchableOpacity style={s.link} onPress={() => switchMode("forgotPassword")}>
              <Text style={s.accent}>Forgot Password?</Text>
            </TouchableOpacity>
            <View style={{ height: 16 }} />
            <TouchableOpacity style={s.link} onPress={() => switchMode("signUp")}>
              <Text style={s.linkText}>
                Don't have an account? <Text style={s.accent}>Sign Up</Text>
              </Text>
            </TouchableOpacity>
          </>
        )}

        {mode === "signUp" && (
          <TouchableOpacity style={s.link} onPress={() => switchMode("signIn")}>
            <Text style={s.linkText}>
              Already have an account? <Text style={s.accent}>Sign In</Text>
            </Text>
          </TouchableOpacity>
        )}

        {mode === "forgotPassword" && (
          <TouchableOpacity style={s.link} onPress={() => switchMode("signIn")}>
            <Text style={s.linkText}>
              Back to <Text style={s.accent}>Sign In</Text>
            </Text>
          </TouchableOpacity>
        )}
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
                  AsyncStorage.clear().catch(() => {});
                  queryClient.clear();
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
