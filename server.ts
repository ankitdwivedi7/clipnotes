import "dotenv/config";
import cors from "cors";
import express from "express";
import { errorMiddleware } from "./lib/http.js";
import { prisma } from "./lib/prisma.js";
import { clipsRouter } from "./routes/clips.js";
import { collectionsRouter } from "./routes/collections.js";
import { entitiesRouter } from "./routes/entities.js";
import { routinesRouter } from "./routes/routines.js";
import { tagsRouter } from "./routes/tags.js";
import { usersRouter } from "./routes/users.js";

const app = express();
const port = Number(process.env.PORT || 3000);

app.use(cors());
app.use(express.json({ limit: "1mb" }));

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "clip-knowledge-app", timestamp: new Date().toISOString() });
});

app.use("/users", usersRouter);
app.use("/clips", clipsRouter);
app.use("/tags", tagsRouter);
app.use("/entities", entitiesRouter);
app.use("/collections", collectionsRouter);
app.use("/routines", routinesRouter);

app.use(errorMiddleware);

const server = app.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`);
});

async function shutdown() {
  await prisma.$disconnect();
  server.close();
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
