import { FastifyInstance } from "fastify";
import { askGemini } from "../services/gemini.js";

export async function aiRoutes(app: FastifyInstance) {
  app.get("/api/ai/test", async () => {
    const response = await askGemini(
      "You are ArchSentinel, an AI code review system. " +
      "Respond with exactly one sentence explaining what a code review is."
    );

    return {
      success: true,
      response,
    };
  });
}
