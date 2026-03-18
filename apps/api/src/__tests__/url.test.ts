import { describe, it, expect } from "vitest";

// Inline URL parsing logic to test
function parseClipUrl(url: string): {
  platform: "YOUTUBE_SHORTS" | "INSTAGRAM_REELS" | null;
  videoId: string | null;
  canonicalUrl: string | null;
} {
  // YouTube Shorts
  const ytMatch = url.match(
    /(?:youtube\.com\/shorts\/|youtu\.be\/)([a-zA-Z0-9_-]+)/
  );
  if (ytMatch) {
    return {
      platform: "YOUTUBE_SHORTS",
      videoId: ytMatch[1],
      canonicalUrl: `https://www.youtube.com/shorts/${ytMatch[1]}`,
    };
  }

  // Instagram Reels
  const igMatch = url.match(
    /instagram\.com\/reels?\/([a-zA-Z0-9_-]+)/
  );
  if (igMatch) {
    return {
      platform: "INSTAGRAM_REELS",
      videoId: igMatch[1],
      canonicalUrl: `https://www.instagram.com/reel/${igMatch[1]}`,
    };
  }

  return { platform: null, videoId: null, canonicalUrl: null };
}

describe("URL parsing", () => {
  describe("YouTube Shorts", () => {
    it("should parse standard YouTube Shorts URL", () => {
      const result = parseClipUrl(
        "https://www.youtube.com/shorts/abc123def45"
      );
      expect(result.platform).toBe("YOUTUBE_SHORTS");
      expect(result.videoId).toBe("abc123def45");
    });

    it("should parse YouTube Shorts URL with query params", () => {
      const result = parseClipUrl(
        "https://youtube.com/shorts/pqylbevm9Lk?si=xawhu6I3_TyxYXaY"
      );
      expect(result.platform).toBe("YOUTUBE_SHORTS");
      expect(result.videoId).toBe("pqylbevm9Lk");
    });

    it("should parse youtu.be short URL", () => {
      const result = parseClipUrl("https://youtu.be/abc123def45");
      expect(result.platform).toBe("YOUTUBE_SHORTS");
      expect(result.videoId).toBe("abc123def45");
    });
  });

  describe("Instagram Reels", () => {
    it("should parse Instagram Reel URL", () => {
      const result = parseClipUrl(
        "https://www.instagram.com/reel/ABC123xyz/"
      );
      expect(result.platform).toBe("INSTAGRAM_REELS");
      expect(result.videoId).toBe("ABC123xyz");
    });

    it("should parse Instagram Reels URL (plural)", () => {
      const result = parseClipUrl(
        "https://www.instagram.com/reels/ABC123xyz/"
      );
      expect(result.platform).toBe("INSTAGRAM_REELS");
      expect(result.videoId).toBe("ABC123xyz");
    });
  });

  describe("Invalid URLs", () => {
    it("should return null for non-supported URLs", () => {
      const result = parseClipUrl("https://www.google.com");
      expect(result.platform).toBeNull();
    });

    it("should return null for regular YouTube videos", () => {
      const result = parseClipUrl(
        "https://www.youtube.com/watch?v=abc123"
      );
      expect(result.platform).toBeNull();
    });
  });
});
