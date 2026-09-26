import http from "node:http";
import { env } from "./config/env.js";
import { createApp } from "./app.js";
import { prisma } from "./db/prisma.js";
import { initSocketServer, getSocketServer } from "./realtime/socket.js";
import { startKeepAlive } from "./services/keep-alive.js";
import { logger, reportError } from "./services/logger.js";

const app = createApp();
const httpServer = http.createServer(app);
const socketServer = initSocketServer(httpServer);
const keepAlive = startKeepAlive();

const server = httpServer.listen(env.PORT, () => {
  logger.info("Marac Workers API started with Realtime Socket support", {
    port: env.PORT,
    nodeEnv: env.NODE_ENV
  });
});

async function shutdown(signal: string) {
  logger.info("Shutting down API", { signal });
  keepAlive.stop();
  socketServer.close();
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
