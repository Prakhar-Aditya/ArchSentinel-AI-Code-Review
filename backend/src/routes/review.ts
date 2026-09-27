import { FastifyInstance } from "fastify";

import {
  cloneRepository,
  loadRepositoryFiles,
} from "../services/repository/repositoryService.js";

import { buildReviewContext } from "../services/review/reviewContext.js";

import { masterAgent } from "../agents/master/masterAgent.js";

import { emitReviewEvent } from "../services/events/reviewEvents.js";

export async function reviewRoutes(
  app: FastifyInstance
) {
  app.post(
    "/api/review/repository",
    async (request) => {
      const body = request.body as {
        repositoryUrl?: string;
      };

      if (!body.repositoryUrl) {
        return {
          success: false,
          error: "repositoryUrl is required.",
        };
      }

      try {
        console.log(
          `Starting repository review: ${body.repositoryUrl}`
        );

        /*
         * ==========================================
         * REPOSITORY ANALYSIS STARTED
         * ==========================================
         */

        emitReviewEvent({
          type: "repository",
          status: "started",
          message:
            "Repository ingestion started.",
        });

        /*
         * ==========================================
         * CLONE REPOSITORY
         * ==========================================
         */

        const repositoryDirectory =
          await cloneRepository(
            body.repositoryUrl
          );

        console.log(
          `Repository cloned: ${repositoryDirectory}`
        );

        /*
         * ==========================================
         * LOAD SOURCE FILES
         * ==========================================
         */

        const files =
          await loadRepositoryFiles(
            repositoryDirectory
          );

        console.log(
          `Loaded ${files.length} source files.`
        );

        emitReviewEvent({
          type: "repository",
          status: "completed",
          message:
            `Repository ingestion completed. Loaded ${files.length} source file(s).`,
        });

        /*
         * ==========================================
         * BUILD REVIEW CONTEXT
         * ==========================================
         */

        const reviewContext =
          buildReviewContext(files);

        /*
         * ==========================================
         * MASTER AGENT
         * ==========================================
         *
         * Master Agent emits its own SSE events,
         * including specialist and synthesis events.
         */

        const result =
          await masterAgent(
            reviewContext.files
          );

        /*
         * ==========================================
         * COMPLETE REVIEW
         * ==========================================
         */

        emitReviewEvent({
          type: "completed",
          status: "completed",
          message:
            "ArchSentinel repository review completed successfully.",
        });

        return {
          success: true,

          repository: {
            fileCount: files.length,

            files: files.map(
              (file) => ({
                path: file.path,
                language: file.language,
              })
            ),
          },

          result,
        };
      } catch (error) {
        console.error(
          "Repository review failed:",
          error
        );

        /*
         * ==========================================
         * REVIEW FAILURE
         * ==========================================
         */

        emitReviewEvent({
          type: "failed",
          status: "failed",
          message:
            error instanceof Error
              ? error.message
              : "Repository review failed.",
        });

        return {
          success: false,

          error:
            error instanceof Error
              ? error.message
              : String(error),
        };
      }
    }
  );
}