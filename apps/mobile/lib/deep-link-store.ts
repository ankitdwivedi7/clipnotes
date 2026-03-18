/**
 * Simple module-level store for deep link URLs.
 * Avoids React context re-render loops.
 */
let _pendingUrl: string | null = null;

export function setPendingIngestUrl(url: string) {
  _pendingUrl = url;
}

export function consumePendingIngestUrl(): string | null {
  const url = _pendingUrl;
  _pendingUrl = null; // consume once
  return url;
}
