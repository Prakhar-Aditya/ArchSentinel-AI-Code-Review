import { FastifyInstance } from "fastify";
import { logicAgent } from "../agents/logic/logicAgent.js";
import type { ReviewFile } from "../types/review.js";

export async function logicRoutes(
  app: FastifyInstance
) {
  app.post(
    "/api/agents/logic",
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

      const result = await logicAgent(files);

      return {
        success: true,
        result,
      };
    }
  );
}