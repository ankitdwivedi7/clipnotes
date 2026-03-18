import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";

const API_URL =
  Constants.expoConfig?.extra?.apiUrl ||
  process.env.EXPO_PUBLIC_API_URL ||
  "http://localhost:3000";

type AuthContextType = {
  isLoaded: boolean;
  isSignedIn: boolean;
  userId: string | null;
  userEmail: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => void;
  getToken: () => Promise<string | null>;
};

const AuthContext = createContext<AuthContextType>({
  isLoaded: false,
  isSignedIn: false,
  userId: null,
  userEmail: null,
  signIn: async () => {},
  signUp: async () => {},
  signOut: () => {},
  getToken: async () => null,
});

const TOKEN_KEY = "clipnotes_auth_token";
const USER_KEY = "clipnotes_auth_user";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  // Load saved auth on mount
  useEffect(() => {
    (async () => {
      try {
        const [savedToken, savedUser] = await Promise.all([
          AsyncStorage.getItem(TOKEN_KEY),
          AsyncStorage.getItem(USER_KEY),
        ]);
        if (savedToken && savedUser) {
          const user = JSON.parse(savedUser);
          setToken(savedToken);
          setUserId(user.id);
          setUserEmail(user.email);
        }
      } catch {
        // ignore
      } finally {
        setIsLoaded(true);
      }
    })();
  }, []);

  const getToken = useCallback(async () => token, [token]);

  const signIn = useCallback(async (email: string, password: string) => {
    const res = await fetch(`${API_URL}/api/v1/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Login failed");

    await AsyncStorage.setItem(TOKEN_KEY, data.token);
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(data.user));
    setToken(data.token);
    setUserId(data.user.id);
    setUserEmail(data.user.email);
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    const res = await fetch(`${API_URL}/api/v1/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Signup failed");

    await AsyncStorage.setItem(TOKEN_KEY, data.token);
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(data.user));
    setToken(data.token);
    setUserId(data.user.id);
    setUserEmail(data.user.email);
  }, []);

  const signOut = useCallback(async () => {
    await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
    setToken(null);
    setUserId(null);
    setUserEmail(null);
  }, []);

  const isSignedIn = !!token;

  return (
    <AuthContext.Provider
      value={{
        isLoaded,
        isSignedIn,
        userId,
        userEmail,
        signIn,
        signUp,
        signOut,
        getToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
