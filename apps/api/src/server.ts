import { env } from "./config/env.js";
import { createApp } from "./app.js";
import { prisma } from "./db/prisma.js";
import { startKeepAlive } from "./services/keep-alive.js";
import { logger, reportError } from "./services/logger.js";

const app = createApp();
const keepAlive = startKeepAlive();

const server = app.listen(env.PORT, () => {
  logger.info("Marac Workers API started", {
    port: env.PORT,
    nodeEnv: env.NODE_ENV
  });
});

async function shutdown(signal: string) {
  logger.info("Shutting down API", { signal });
  keepAlive.stop();
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}

process.on("SIGTERM", () => {
  void shutdown("SIGTERM");
});

process.on("SIGINT", () => {
  void shutdown("SIGINT");
});

process.on("unhandledRejection", (error) => {
  reportError(error, { event: "unhandledRejection" });
});

process.on("uncaughtException", (error) => {
  reportError(error, { event: "uncaughtException" });
  void shutdown("uncaughtException");
});
