import { prisma } from "@/lib/prisma";
import { getSubtitles } from "youtube-caption-extractor";

function extractVideoId(canonicalUrl: string): string | null {
  const match = canonicalUrl.match(/shorts\/([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : null;
}

async function whisperTranscribe(audioUrl: string): Promise<string | null> {
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  if (!OPENAI_API_KEY) {
    console.log("[Transcript] No OPENAI_API_KEY — skipping Whisper transcription");
    return null;
  }

  try {
    // Download audio
    const response = await fetch(audioUrl);
    if (!response.ok) return null;

    const audioBuffer = await response.arrayBuffer();
    const blob = new Blob([audioBuffer], { type: "audio/mp4" });

    // Send to Whisper API
    const formData = new FormData();
    formData.append("file", blob, "audio.mp4");
    formData.append("model", "whisper-1");
    formData.append("language", "en");

    const whisperRes = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${OPENAI_API_KEY}` },
      body: formData,
    });

    if (!whisperRes.ok) {
      console.warn("[Transcript] Whisper API error:", whisperRes.status);
      return null;
    }

    const result = await whisperRes.json();
    return result.text || null;
  } catch (error) {
    console.warn("[Transcript] Whisper transcription failed:", error);
    return null;
  }
}

export async function processTranscript(clipId: string) {
  const clip = await prisma.clip.findUniqueOrThrow({ where: { id: clipId } });

  await prisma.clip.update({
    where: { id: clipId },
    data: { status: "EXTRACTING_TRANSCRIPT" },
  });

  // Try YouTube captions first
  if (clip.platform === "YOUTUBE_SHORTS") {
    const videoId = extractVideoId(clip.canonicalUrl);
    if (videoId) {
      try {
        const subtitles = await getSubtitles({ videoID: videoId, lang: "en" });
        if (subtitles && subtitles.length > 0) {
          const transcript = subtitles.map((s) => s.text).join(" ");
          await prisma.clip.update({
            where: { id: clipId },
            data: { transcript },
          });
          return; // Got captions, done
        }
      } catch (error) {
        console.warn(`[Transcript] No captions for ${videoId}:`, error);
      }
    }
  }

  // Fallback: try Whisper transcription if we have a media URL
  // For Instagram Reels, try the canonical URL
  // For YouTube without captions, try a dl URL
  if (clip.platform === "INSTAGRAM_REELS") {
    const transcript = await whisperTranscribe(clip.canonicalUrl);
    if (transcript) {
      await prisma.clip.update({
        where: { id: clipId },
        data: { transcript },
      });
    }
  }
}
