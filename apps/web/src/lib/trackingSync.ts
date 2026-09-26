import type { BookingStatus } from "@the-wings/types";

export const TRACKING_BROADCAST_CHANNEL = "marac_ride_tracking_channel";
export const TRACKING_STORAGE_KEY_PREFIX = "marac_tracking_state_";

export interface LiveRideState {
  bookingCode: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  customerLocation: { lat: number; lng: number };
  worker: {
    id: string;
    name: string;
    phone: string;
    trade: string;
    rating: number;
    completedJobs: number;
    avatar: string;
  };
  status: BookingStatus;
  workerLocation: {
    lat: number;
    lng: number;
    heading: number;
    speed?: number;
  };
  etaMinutes: number | null;
  distanceKm: number | null;
  lastUpdated: string;
  isSimulating?: boolean;
}

// Default realistic demo booking in Guwahati (Ganeshguri to Zoo Road)
export const DEMO_RIDE_BOOKING: LiveRideState = {
  bookingCode: "MW-DEMO-RIDE",
  customerName: "Rahul Sharma",
  customerPhone: "+91 98765 43210",
  customerAddress: "Zoo Road Tiniali, Near Central Mall, Guwahati",
  customerLocation: {
    lat: 26.1667,
    lng: 91.7770
  },
  worker: {
    id: "staff-worker-1",
    name: "Biswajit Saikia",
    phone: "+91 93651 23456",
    trade: "Licensed Electrician Pro",
    rating: 4.9,
    completedJobs: 142,
    avatar: "/images/workers/electrician.jpg"
  },
  status: "ASSIGNED",
  workerLocation: {
    lat: 26.1520,
    lng: 91.7850,
    heading: 330,
    speed: 28
  },
  etaMinutes: 6,
  distanceKm: 2.1,
  lastUpdated: new Date().toISOString(),
  isSimulating: false
};

// Calculate heading/bearing in degrees between two GPS coordinates
export function calculateBearing(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const toDeg = (rad: number) => (rad * 180) / Math.PI;

  const φ1 = toRad(lat1);
  const φ2 = toRad(lat2);
  const Δλ = toRad(lon2 - lon1);

  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);

  const θ = Math.atan2(y, x);
  return (toDeg(θ) + 360) % 360;
}

// Calculate straight-line distance in km (Haversine)
export function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return +(R * c).toFixed(2);
}

// Broadcast ride state across tabs and local storage
export function broadcastRideState(state: Partial<LiveRideState> & { bookingCode: string }) {
  if (typeof window === "undefined") return;

  try {
    // 1. Update localStorage
    const key = `${TRACKING_STORAGE_KEY_PREFIX}${state.bookingCode}`;
    const existing = getStoredRideState(state.bookingCode);
    const updated = {
      ...(existing || DEMO_RIDE_BOOKING),
      ...state,
      lastUpdated: new Date().toISOString()
    };
    window.localStorage.setItem(key, JSON.stringify(updated));

    // 2. Broadcast via BroadcastChannel
    if ("BroadcastChannel" in window) {
      const channel = new BroadcastChannel(TRACKING_BROADCAST_CHANNEL);
      channel.postMessage({
        type: "RIDE_UPDATE",
        bookingCode: state.bookingCode,
        payload: updated
      });
      channel.close();
    }
  } catch (err) {
    console.warn("Could not broadcast ride state", err);
  }
}

// Retrieve stored state from localStorage
export function getStoredRideState(bookingCode: string): LiveRideState | null {
  if (typeof window === "undefined") return null;

  try {
    const key = `${TRACKING_STORAGE_KEY_PREFIX}${bookingCode}`;
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as LiveRideState;
  } catch {
    return null;
  }
}

// Save last active booking code
export function setLastActiveBookingCode(code: string) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem("marac_last_active_booking", code);
  } catch {
    // ignore
  }
}

export function getLastActiveBookingCode(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem("marac_last_active_booking");
  } catch {
    return null;
  }
}
