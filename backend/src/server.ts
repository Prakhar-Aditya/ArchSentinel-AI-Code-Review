import Fastify from "fastify";
import cors from "@fastify/cors";
import dotenv from "dotenv";

import { aiRoutes } from "./routes/ai.js";
import { securityRoutes } from "./routes/security.js";
import { performanceRoutes } from "./routes/performance.js";
import { logicRoutes } from "./routes/logic.js";
import { masterRoutes } from "./routes/master.js";
import { repositoryRoutes } from "./routes/repository.js";
import { reviewRoutes } from "./routes/review.js";
import { eventRoutes } from "./routes/events.js";
import { codeRoutes } from "./routes/code.js";

dotenv.config();


const app = Fastify({
  logger: true,
});

async function startServer() {
  await app.register(cors, {
    origin: true,
  });

  // Register AI routes
  await app.register(aiRoutes);
  await app.register(securityRoutes);
  await app.register(performanceRoutes);
  await app.register(logicRoutes);
  await app.register(masterRoutes);
  await app.register(repositoryRoutes);
  await app.register(reviewRoutes);
  await app.register(eventRoutes);
  await app.register(codeRoutes);
  
  // Health check
  app.get("/", async () => {
    return {
      name: "ArchSentinel",
      status: "online",
      message: "ArchSentinel backend is running",
    };
  });

  const PORT = Number(process.env.PORT) || 4000;

  try {
    await app.listen({
      port: PORT,
      host: "0.0.0.0",
    });

    console.log(`🚀 ArchSentinel backend running on port ${PORT}`);
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
}

startServer();