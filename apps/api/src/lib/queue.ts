import { Queue } from "bullmq";
import { redis } from "./redis";

export const clipProcessingQueue = new Queue("clip-processing", {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 5000 },
    removeOnComplete: { count: 1000 },
    removeOnFail: { count: 5000 },
  },
});
