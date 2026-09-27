import type { FastifyInstance } from "fastify";
import type { ReviewFile } from "../types/review.js";
import { masterAgent } from "../agents/master/masterAgent.js";

export async function codeRoutes(
  fastify: FastifyInstance
) {
  fastify.post("/api/review/code", async (request, reply) => {
    try {
      const body = request.body as {
        fileName?: string;
        language?: string;
        code?: string;
      };

      /*
       * =====================================================
       * VALIDATION
       * =====================================================
       */

      if (!body.fileName?.trim()) {
        return reply.status(400).send({
          success: false,
          error: "File name is required.",
        });
      }

      if (!body.code?.trim()) {
        return reply.status(400).send({
          success: false,
          error: "Code is required.",
        });
      }

      /*
       * =====================================================
       * CONVERT PASTED CODE INTO THE SAME REVIEW FILE
       * FORMAT USED BY THE GITHUB REPOSITORY FLOW
       * =====================================================
       */

      const files: ReviewFile[] = [
        {
          path: body.fileName.trim(),
          language:
            body.language?.trim() || "unknown",
          content: body.code,
        },
      ];

      /*
       * =====================================================
       * REUSE EXISTING MASTER AGENT
       * =====================================================
       *
       * This is intentionally the same masterAgent()
       * used by the GitHub repository ingestion flow.
       */

      const result = await masterAgent(files);

      /*
       * =====================================================
       * RETURN STANDARD REVIEW RESPONSE
       * =====================================================
       */

      return reply.send({
        success: true,
        result,
      });

    } catch (error) {
      console.error(
        "[ArchSentinel] Code review failed:",
        error
      );

      return reply.status(500).send({
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Code review failed.",
      });
    }
  });
}