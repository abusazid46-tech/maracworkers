import type { BookingStatus } from "@the-wings/types";

export const TRACKING_BROADCAST_CHANNEL = "marac_ride_tracking_channel";
export const TRACKING_STORAGE_KEY_PREFIX = "marac_tracking_state_";

export const GUWAHATI_DEFAULT_COORDS = {
  lat: 26.1445,
  lng: 91.7362
};

export interface LiveRideState {
  bookingCode: string;
  customerName: string;
  customerPhone?: string;
  customerAddress: string;
  customerLocation: { lat: number; lng: number };
  worker?: {
    id: string;
    name: string;
    phone: string;
    trade?: string;
    rating?: number;
    avatar?: string;
  } | null;
  status: BookingStatus;
  workerLocation?: {
    lat: number;
    lng: number;
    heading: number;
    speed?: number;
  } | null;
  etaMinutes: number | null;
  distanceKm: number | null;
  lastUpdated: string;
}

// Calculate compass heading (bearing in degrees 0-360) between two real GPS coordinates
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

// Calculate real-world surface distance in kilometers (Haversine formula)
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

// Estimate arrival time in minutes based on distance and city driving speed
export function estimateEtaMinutes(distanceKm: number, averageSpeedKmh: number = 25): number {
  if (distanceKm <= 0.05) return 0;
  const hours = distanceKm / Math.max(10, averageSpeedKmh);
  return Math.max(1, Math.ceil(hours * 60));
}

// Broadcast live ride updates across tabs and local storage for zero latency
export function broadcastRideState(state: Partial<LiveRideState> & { bookingCode: string }) {
  if (typeof window === "undefined" || !state.bookingCode) return;

  try {
    const key = `${TRACKING_STORAGE_KEY_PREFIX}${state.bookingCode}`;
    const existing = getStoredRideState(state.bookingCode);
    const updated: LiveRideState = {
      bookingCode: state.bookingCode,
      customerName: state.customerName || existing?.customerName || "Customer",
      customerPhone: state.customerPhone || existing?.customerPhone,
      customerAddress: state.customerAddress || existing?.customerAddress || "Guwahati",
      customerLocation: state.customerLocation || existing?.customerLocation || GUWAHATI_DEFAULT_COORDS,
      worker: state.worker !== undefined ? state.worker : existing?.worker,
      status: state.status || existing?.status || "CONFIRMED",
      workerLocation: state.workerLocation !== undefined ? state.workerLocation : existing?.workerLocation,
      etaMinutes: state.etaMinutes !== undefined ? state.etaMinutes : existing?.etaMinutes || null,
      distanceKm: state.distanceKm !== undefined ? state.distanceKm : existing?.distanceKm || null,
      lastUpdated: new Date().toISOString()
    };

    window.localStorage.setItem(key, JSON.stringify(updated));

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
  if (typeof window === "undefined" || !bookingCode) return null;

  try {
    const key = `${TRACKING_STORAGE_KEY_PREFIX}${bookingCode}`;
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as LiveRideState;
  } catch {
    return null;
  }
}

// Save & retrieve active booking reference
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
