import { prisma } from "@/lib/prisma";

interface OEmbedResponse {
  title?: string;
  author_name?: string;
  author_url?: string;
  thumbnail_url?: string;
}

async function fetchYouTubeMetadata(canonicalUrl: string) {
  const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(canonicalUrl)}&format=json`;
  const response = await fetch(oembedUrl);

  if (!response.ok) {
    throw new Error(`YouTube oEmbed failed: ${response.status}`);
  }

  const data = (await response.json()) as OEmbedResponse;

  // Extract handle from author_url
  let authorHandle: string | null = null;
  if (data.author_url) {
    const match = data.author_url.match(/\/@([^/]+)/);
    if (match) authorHandle = `@${match[1]}`;
  }

  return {
    title: data.title || null,
    authorName: data.author_name || null,
    authorHandle,
    thumbnailUrl: data.thumbnail_url || null,
  };
}

async function fetchInstagramMetadata(canonicalUrl: string) {
  // Instagram oEmbed is restricted; try OG tags via fetch
  try {
    const response = await fetch(canonicalUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; ClipNotes/1.0)",
      },
    });

    if (!response.ok) {
      return { title: null, authorName: null, authorHandle: null, thumbnailUrl: null };
    }

    const html = await response.text();

    const getOgTag = (property: string): string | null => {
      const regex = new RegExp(
        `<meta[^>]*property=["']og:${property}["'][^>]*content=["']([^"']*)["']`,
        "i"
      );
      const match = html.match(regex);
      return match ? match[1] : null;
    };

    return {
      title: getOgTag("title"),
      authorName: getOgTag("description")?.split(" on Instagram")?.[0] || null,
      authorHandle: null,
      thumbnailUrl: getOgTag("image"),
    };
  } catch {
    return { title: null, authorName: null, authorHandle: null, thumbnailUrl: null };
  }
}

export async function processMetadata(clipId: string) {
  const clip = await prisma.clip.findUniqueOrThrow({ where: { id: clipId } });

  await prisma.clip.update({
    where: { id: clipId },
    data: { status: "FETCHING_METADATA" },
  });

  const metadata =
    clip.platform === "YOUTUBE_SHORTS"
      ? await fetchYouTubeMetadata(clip.canonicalUrl)
      : await fetchInstagramMetadata(clip.canonicalUrl);

  await prisma.clip.update({
    where: { id: clipId },
    data: {
      title: metadata.title,
      authorName: metadata.authorName,
      authorHandle: metadata.authorHandle,
      thumbnailUrl: metadata.thumbnailUrl,
    },
  });
}
