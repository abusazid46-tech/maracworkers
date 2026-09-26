import { Server as HttpServer } from "node:http";
import { Server, Socket } from "socket.io";
import { isCorsOriginAllowed } from "../config/env.js";
import { prisma } from "../db/prisma.js";
import { logger } from "../services/logger.js";
import type { WorkerLocationPayload, TrackingUpdateEvent } from "@the-wings/types";

let io: Server | null = null;

export function getSocketServer(): Server | null {
  return io;
}

export function initSocketServer(httpServer: HttpServer): Server {
  io = new Server(httpServer, {
    cors: {
      origin(origin, callback) {
        callback(null, isCorsOriginAllowed(origin));
      },
      credentials: true
    },
    transports: ["websocket", "polling"],
    pingTimeout: 30000,
    pingInterval: 25000
  });

  io.on("connection", (socket: Socket) => {
    logger.info("Realtime socket connected", { socketId: socket.id });

    // Client (Customer or Admin) joins a room for a specific booking
    socket.on("join:booking", (bookingIdentifier: string) => {
      if (!bookingIdentifier) return;
      const room = `booking:${bookingIdentifier}`;
      socket.join(room);
      logger.info(`Socket ${socket.id} joined room ${room}`);
      socket.emit("joined:booking", { room, socketId: socket.id });
    });

    // Leave a booking room
    socket.on("leave:booking", (bookingIdentifier: string) => {
      if (!bookingIdentifier) return;
      const room = `booking:${bookingIdentifier}`;
      socket.leave(room);
      logger.info(`Socket ${socket.id} left room ${room}`);
    });

    // Worker streams continuous GPS coordinates
    socket.on("worker:update_loc", async (payload: WorkerLocationPayload) => {
      try {
        if (!payload?.bookingId || !payload?.latitude || !payload?.longitude) {
          return;
        }

        const trackingData: TrackingUpdateEvent = {
          bookingId: payload.bookingId,
          workerId: payload.workerId,
          latitude: Number(payload.latitude),
          longitude: Number(payload.longitude),
          heading: payload.heading != null ? Number(payload.heading) : undefined,
          speed: payload.speed != null ? Number(payload.speed) : undefined,
          timestamp: payload.timestamp || new Date().toISOString()
        };

        // 1. Broadcast immediately to anyone listening in this booking room (web / admin)
        io?.to(`booking:${payload.bookingId}`).emit("tracking:update", trackingData);

        // 2. Persist worker's current coordinates to database (asynchronously)
        if (payload.workerId) {
          await prisma.staff.update({
            where: { id: payload.workerId },
            data: {
              currentLat: payload.latitude,
              currentLng: payload.longitude,
              lastHeading: payload.heading,
              lastLocationAt: new Date()
            }
          }).catch((err) => {
            logger.warn("Could not update staff coordinates in db", { error: String(err) });
          });
        }
      } catch (error) {
        logger.error("Failed processing worker location update", { error: String(error) });
      }
    });

    socket.on("disconnect", (reason) => {
      logger.info("Realtime socket disconnected", { socketId: socket.id, reason });
    });
  });

  return io;
}

export function notifyBookingStatusChange(bookingIdentifier: string, status: string, extra?: Record<string, unknown>) {
  if (!io) return;
  io.to(`booking:${bookingIdentifier}`).emit("booking:status_change", {
    bookingId: bookingIdentifier,
    status,
    timestamp: new Date().toISOString(),
    ...extra
  });
}

export function broadcastWorkerLocation(payload: WorkerLocationPayload) {
  if (!io) return;
  const trackingData: TrackingUpdateEvent = {
    bookingId: payload.bookingId,
    workerId: payload.workerId,
    latitude: Number(payload.latitude),
    longitude: Number(payload.longitude),
    heading: payload.heading != null ? Number(payload.heading) : undefined,
    speed: payload.speed != null ? Number(payload.speed) : undefined,
    timestamp: payload.timestamp || new Date().toISOString()
  };
  io.to(`booking:${payload.bookingId}`).emit("tracking:update", trackingData);
}
