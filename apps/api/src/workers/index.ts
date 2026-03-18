import { Worker, Job } from "bullmq";
import IORedis from "ioredis";
import { PrismaClient } from "@prisma/client";
import { processMetadata } from "./metadata.worker";
import { processTranscript } from "./transcript.worker";
import { processSummarize } from "./summarize.worker";

// Worker runs as standalone process — set up its own connections
const redis = new IORedis(process.env.REDIS_URL || "redis://localhost:6379", {
  maxRetriesPerRequest: null,
});

const prisma = new PrismaClient();

async function processClip(job: Job<{ clipId: string }>) {
  const { clipId } = job.data;
  console.log(`[Worker] Processing clip ${clipId}`);

  try {
    // Stage 1: Metadata
    console.log(`[Worker] Stage 1: Fetching metadata for ${clipId}`);
    await processMetadata(clipId);

    // Stage 2: Transcript
    console.log(`[Worker] Stage 2: Extracting transcript for ${clipId}`);
    await processTranscript(clipId);

    // Stage 3: Summarize with Claude
    console.log(`[Worker] Stage 3: Summarizing ${clipId}`);
    await processSummarize(clipId);

    console.log(`[Worker] Completed processing ${clipId}`);
  } catch (error) {
    console.error(`[Worker] Failed processing ${clipId}:`, error);

    await prisma.clip.update({
      where: { id: clipId },
      data: {
        status: "FAILED",
        failureReason:
          error instanceof Error ? error.message : "Unknown error",
      },
    });

    throw error; // Let BullMQ handle retries
  }
}

const worker = new Worker("clip-processing", processClip, {
  connection: redis,
  concurrency: 3,
  settings: {
    backoffStrategy: (attemptsMade: number) => {
      // Exponential backoff: 2s, 4s, 8s
      return Math.min(2000 * Math.pow(2, attemptsMade - 1), 10000);
    },
  },
});

worker.on("completed", (job) => {
  console.log(`[Worker] Job ${job.id} completed`);
});

worker.on("failed", (job, error) => {
  console.error(`[Worker] Job ${job?.id} failed:`, error.message);
});

console.log("[Worker] ClipNotes worker started, waiting for jobs...");

// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("[Worker] Shutting down...");
  await worker.close();
  await redis.quit();
  await prisma.$disconnect();
  process.exit(0);
});
