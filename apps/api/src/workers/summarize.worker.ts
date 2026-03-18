import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/prisma";

const anthropic = new Anthropic();

const VALID_ENTITY_TYPES = new Set(["PERSON", "PRODUCT", "BRAND", "PLACE", "CONCEPT"]);

interface SummaryResult {
  summary: string;
  keyTakeaways: string[];
  entities: Array<{
    name: string;
    type: "PERSON" | "PRODUCT" | "BRAND" | "PLACE" | "CONCEPT";
  }>;
}

async function callClaudeWithRetry(
  params: Parameters<typeof anthropic.messages.create>[0],
  maxRetries = 3,
): Promise<Anthropic.Message> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await anthropic.messages.create(params);
    } catch (error: unknown) {
      const isRetryable =
        error instanceof Anthropic.APIError &&
        (error.status === 500 || error.status === 502 || error.status === 503 || error.status === 529);

      if (isRetryable && attempt < maxRetries) {
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
        console.warn(
          `[Summarize] Anthropic API error (${(error as Anthropic.APIError).status}), retrying in ${delay}ms (attempt ${attempt}/${maxRetries})`,
        );
        await new Promise((r) => setTimeout(r, delay));
        continue;
      }
      throw error;
    }
  }
  throw new Error("Unreachable");
}

export async function processSummarize(clipId: string) {
  const clip = await prisma.clip.findUniqueOrThrow({
    where: { id: clipId },
  });

  await prisma.clip.update({
    where: { id: clipId },
    data: { status: "SUMMARIZING" },
  });

  const transcriptSection = clip.transcript
    ? `Transcript:\n${clip.transcript.slice(0, 4000)}`
    : "No transcript available. Analyze based on title and metadata only.";

  const message = await callClaudeWithRetry({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024,
    temperature: 0.3,
    system:
      "You are an assistant that analyzes short-form video content. Given a video's metadata and transcript, produce a structured analysis. Always respond with valid JSON only, no markdown.",
    messages: [
      {
        role: "user",
        content: `Analyze this short-form video:

Title: ${clip.title || "Unknown"}
Author: ${clip.authorName || "Unknown"} ${clip.authorHandle ? `(${clip.authorHandle})` : ""}
Platform: ${clip.platform}
Duration: ${clip.durationSec ? `${clip.durationSec}s` : "Unknown"}

${transcriptSection}

${clip.userNote ? `User's note: ${clip.userNote}` : ""}

Respond in this exact JSON format:
{
  "summary": "2-3 sentence summary of the video's content and main message",
  "keyTakeaways": ["takeaway 1", "takeaway 2", "takeaway 3"],
  "entities": [
    { "name": "Entity Name", "type": "PERSON|PRODUCT|BRAND|PLACE|CONCEPT" }
  ]
}

IMPORTANT: entity type MUST be exactly one of: PERSON, PRODUCT, BRAND, PLACE, CONCEPT. Do not use any other type values.`,
      },
    ],
  });

  const textBlock = message.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("No text response from Claude");
  }

  const result: SummaryResult = JSON.parse(textBlock.text);

  // Update clip with summary and takeaways
  await prisma.clip.update({
    where: { id: clipId },
    data: {
      summary: result.summary,
      keyTakeaways: result.keyTakeaways,
      status: "COMPLETED",
    },
  });

  // Create entities — filter out any with invalid types
  const validEntities = result.entities.filter((e) => VALID_ENTITY_TYPES.has(e.type));
  if (validEntities.length > 0) {
    await prisma.entity.createMany({
      data: validEntities.map((e) => ({
        clipId,
        name: e.name,
        type: e.type,
      })),
    });
  }

  if (validEntities.length < result.entities.length) {
    const skipped = result.entities.filter((e) => !VALID_ENTITY_TYPES.has(e.type));
    console.warn(
      `[Summarize] Skipped ${skipped.length} entities with invalid types:`,
      skipped.map((e) => `${e.name} (${e.type})`),
    );
  }
}
