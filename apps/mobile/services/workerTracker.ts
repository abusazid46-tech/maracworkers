import * as Location from "expo-location";
import { io, Socket } from "socket.io-client";
import type { WorkerLocationPayload } from "@the-wings/types";
import { useEffect, useState } from "react";

export type TrackingOptions = {
  bookingId: string;
  workerId: string;
  apiUrl: string;
  distanceInterval?: number;
  timeInterval?: number;
};

class WorkerLocationManager {
  private socket: Socket | null = null;
  private watcher: Location.LocationSubscription | null = null;
  private isRunning = false;

  async requestPermissions(): Promise<boolean> {
    const { status: fgStatus } = await Location.requestForegroundPermissionsAsync();
    if (fgStatus !== "granted") {
      return false;
    }
    return true;
  }

  async startTracking(options: TrackingOptions, onLocation?: (loc: Location.LocationObject) => void) {
    if (this.isRunning) return;

    const permitted = await this.requestPermissions();
    if (!permitted) {
      throw new Error("Location permission is required for live technician dispatch");
    }

    this.socket = io(options.apiUrl, {
      transports: ["websocket", "polling"],
      reconnectionAttempts: 10
    });

    this.socket.emit("join:booking", options.bookingId);

    this.watcher = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        timeInterval: options.timeInterval ?? 5000,
        distanceInterval: options.distanceInterval ?? 10
      },
      (location) => {
        const payload: WorkerLocationPayload = {
          bookingId: options.bookingId,
          workerId: options.workerId,
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          heading: location.coords.heading ?? undefined,
          speed: location.coords.speed ?? undefined,
          accuracy: location.coords.accuracy ?? undefined,
          timestamp: new Date(location.timestamp).toISOString()
        };

        // Emit through realtime socket
        this.socket?.emit("worker:update_loc", payload);

        onLocation?.(location);
      }
    );

    this.isRunning = true;
  }

  stopTracking() {
    if (this.watcher) {
      this.watcher.remove();
      this.watcher = null;
    }
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.isRunning = false;
  }

  getIsRunning() {
    return this.isRunning;
  }
}

export const workerTracker = new WorkerLocationManager();

export function useWorkerTracker(bookingId?: string, workerId?: string, apiUrl?: string) {
  const [isTracking, setIsTracking] = useState(false);
  const [currentCoords, setCurrentCoords] = useState<{ latitude: number; longitude: number; heading?: number | null } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const start = async () => {
    if (!bookingId || !workerId || !apiUrl) {
      setError("Missing booking or worker information");
      return;
    }

    try {
      setError(null);
      await workerTracker.startTracking(
        { bookingId, workerId, apiUrl },
        (loc) => {
          setCurrentCoords({
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
            heading: loc.coords.heading
          });
        }
      );
      setIsTracking(true);
    } catch (err: any) {
      setError(err?.message || "Failed to start GPS tracking");
      setIsTracking(false);
    }
  };

  const stop = () => {
    workerTracker.stopTracking();
    setIsTracking(false);
  };

  useEffect(() => {
    return () => {
      workerTracker.stopTracking();
    };
  }, []);

  return {
    isTracking,
    currentCoords,
    error,
    startTracking: start,
    stopTracking: stop
  };
}
