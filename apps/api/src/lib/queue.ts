import { Queue, type ConnectionOptions } from "bullmq";
import { redis } from "./redis";

export const clipProcessingQueue = new Queue("clip-processing", {
  connection: redis as unknown as ConnectionOptions,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 5000 },
    removeOnComplete: { count: 1000 },
    removeOnFail: { count: 5000 },
  },
});
