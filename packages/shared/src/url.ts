import { Platform } from "./constants";

interface ParsedUrl {
  canonicalUrl: string;
  platform: Platform;
  videoId: string;
}

const YT_SHORTS_PATTERNS = [
  /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
  /youtu\.be\/([a-zA-Z0-9_-]{11})/,
  /youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
];

const IG_REELS_PATTERNS = [
  /instagram\.com\/reels?\/([a-zA-Z0-9_-]+)/,
];

export function parseClipUrl(rawUrl: string): ParsedUrl | null {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return null;
  }

  // YouTube Shorts
  for (const pattern of YT_SHORTS_PATTERNS) {
    const match = rawUrl.match(pattern);
    if (match) {
      const videoId = match[1];
      return {
        canonicalUrl: `https://www.youtube.com/shorts/${videoId}`,
        platform: Platform.YOUTUBE_SHORTS,
        videoId,
      };
    }
  }

  // Instagram Reels
  for (const pattern of IG_REELS_PATTERNS) {
    const match = rawUrl.match(pattern);
    if (match) {
      const videoId = match[1];
      return {
        canonicalUrl: `https://www.instagram.com/reel/${videoId}`,
        platform: Platform.INSTAGRAM_REELS,
        videoId,
      };
    }
  }

  return null;
}

export function isSupportedUrl(rawUrl: string): boolean {
  return parseClipUrl(rawUrl) !== null;
}
