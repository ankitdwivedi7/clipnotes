import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

interface DeepLinkState {
  /** URL passed in via clipnotes://ingest?url=... */
  pendingUrl: string | null;
  /** Call to set a pending URL (opens the AddUrlModal pre-filled) */
  setPendingUrl: (url: string) => void;
  /** Call after the modal consumes it */
  clearPendingUrl: () => void;
}

const DeepLinkContext = createContext<DeepLinkState>({
  pendingUrl: null,
  setPendingUrl: () => {},
  clearPendingUrl: () => {},
});

export function DeepLinkProvider({ children }: { children: ReactNode }) {
  const [pendingUrl, _setPendingUrl] = useState<string | null>(null);

  const setPendingUrl = useCallback((url: string) => {
    _setPendingUrl(url);
  }, []);

  const clearPendingUrl = useCallback(() => {
    _setPendingUrl(null);
  }, []);

  return (
    <DeepLinkContext.Provider value={{ pendingUrl, setPendingUrl, clearPendingUrl }}>
      {children}
    </DeepLinkContext.Provider>
  );
}

export function useDeepLink() {
  return useContext(DeepLinkContext);
}
