import { FastifyInstance } from "fastify";
import { performanceAgent } from "../agents/performance/performanceAgent.js";
import type { ReviewFile } from "../types/review.js";

export async function performanceRoutes(
  app: FastifyInstance
) {
  app.post(
    "/api/agents/performance",
    async (request) => {
      const body = request.body as {
        code?: string;
      };

      if (!body.code) {
        return {
          success: false,
          error: "Code is required.",
        };
      }

      const files: ReviewFile[] = [
        {
          path: "input-code",
          language: "unknown",
          content: body.code,
        },
      ];

      const result =
        await performanceAgent(files);

      return {
        success: true,
        result,
      };
    }
  );
}
