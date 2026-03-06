import { ClipSource, EntityType, IngestPlatform, TagType } from "@prisma/client";
import { prisma } from "../src/lib/prisma.js";

async function main() {
  const user = await prisma.user.upsert({
    where: { email: "demo@example.com" },
    update: { displayName: "Demo User" },
    create: { displayName: "Demo User", email: "demo@example.com" }
  });

  const tag = await prisma.tag.upsert({
    where: { userId_name: { userId: user.id, name: "Quick Save" } },
    update: {},
    create: { userId: user.id, name: "Quick Save", type: TagType.GENERIC, isPinned: true }
  });

  const clip = await prisma.clip.create({
    data: {
      userId: user.id,
      canonicalUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      source: ClipSource.YOUTUBE,
      sourceVideoId: "dQw4w9WgXcQ",
      title: "Sample Clip"
    }
  });

  await prisma.clipIngestEvent.create({
    data: {
      clipId: clip.id,
      userId: user.id,
      platform: IngestPlatform.WEB,
      rawUrl: clip.canonicalUrl,
      rawSharedText: "Shared from browser",
      noteAtCapture: "Test ingest"
    }
  });

  await prisma.clipTag.create({
    data: {
      clipId: clip.id,
      tagId: tag.id
    }
  });

  const entity = await prisma.clipEntity.create({
    data: {
      clipId: clip.id,
      entityType: EntityType.CONCEPT,
      displayText: "Spaced repetition",
      dataJson: { difficulty: "easy", source: "seed" }
    }
  });

  await prisma.flashcard.create({
    data: {
      userId: user.id,
      clipId: clip.id,
      clipEntityId: entity.id,
      front: "What is spaced repetition?",
      back: "A study technique that spaces reviews over time."
    }
  });

  console.log("Seed complete", { userId: user.id, clipId: clip.id });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
