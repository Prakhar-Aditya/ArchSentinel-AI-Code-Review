import { FastifyInstance } from "fastify";
import {
  cloneRepository,
  loadRepositoryFiles,
} from "../services/repository/repositoryService.js";

export async function repositoryRoutes(
  app: FastifyInstance
) {
  app.post("/api/repository/clone", async (request) => {

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
        `Cloning repository: ${body.repositoryUrl}`
      );

      const repositoryDirectory =
        await cloneRepository(
          body.repositoryUrl
        );

      console.log(
        `Repository cloned to: ${repositoryDirectory}`
      );

      const files =
        await loadRepositoryFiles(
          repositoryDirectory
        );

      console.log(
        `Loaded ${files.length} source files.`
      );

      return {
        success: true,
        repositoryDirectory,
        fileCount: files.length,
        files,
      };

    } catch (error) {

      console.error(
        "Repository ingestion failed:",
        error
      );

      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : String(error),
      };
    }
  });
}