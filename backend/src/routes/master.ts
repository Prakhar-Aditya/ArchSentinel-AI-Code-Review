import { FastifyInstance } from "fastify";
import { masterAgent } from "../agents/master/masterAgent.js";
import type { ReviewFile } from "../types/review.js";

export async function masterRoutes(
  app: FastifyInstance
) {
  app.post(
    "/api/agents/master",
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

      const result = await masterAgent(files);

      return {
        success: true,
        result,
      };
    }
  );
}