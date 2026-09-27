import { FastifyInstance } from "fastify";
import { securityAgent } from "../agents/security/securityAgent.js";
import type { ReviewFile } from "../types/review.js";

export async function securityRoutes(
  app: FastifyInstance
) {
  app.post(
    "/api/agents/security",
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

      const result = await securityAgent(files);

      return {
        success: true,
        result,
      };
    }
  );
}