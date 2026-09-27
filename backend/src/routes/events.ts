import { FastifyInstance } from "fastify";
import {
  addReviewClient,
} from "../services/events/reviewEvents.js";

export async function eventRoutes(
  app: FastifyInstance
) {
  app.get(
    "/api/review/events",
    async (request, reply) => {
      const response = reply.raw;

      response.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "Access-Control-Allow-Origin": "*",
      });

      response.write(
        `data: ${JSON.stringify({
          type: "connection",
          status: "completed",
          message: "SSE connection established",
          timestamp: new Date().toISOString(),
        })}\n\n`
      );

      addReviewClient(response);

      request.raw.on("close", () => {
        response.end();
      });

      return reply;
    }
  );
}