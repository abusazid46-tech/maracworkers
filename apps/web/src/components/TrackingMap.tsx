"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import type { BookingStatus, StaffSummary, TrackingUpdateEvent } from "@the-wings/types";
import {
  TRACKING_BROADCAST_CHANNEL,
  getStoredRideState,
  calculateDistanceKm,
  DEMO_RIDE_BOOKING
} from "@/lib/trackingSync";

export interface TrackingMapProps {
  bookingCode: string;
  customerName: string;
  customerAddress: string;
  customerLocation: {
    lat: number;
    lng: number;
  };
  initialStatus: BookingStatus;
  initialStaff?: StaffSummary | null;
  apiBaseUrl: string;
  onStatusChange?: (newStatus: BookingStatus) => void;
  onSwitchToWorkerMode?: () => void;
}

export default function TrackingMap({
  bookingCode,
  customerName,
  customerAddress,
  customerLocation,
  initialStatus,
  initialStaff,
  apiBaseUrl,
  onStatusChange,
  onSwitchToWorkerMode
}: TrackingMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const workerMarkerRef = useRef<any>(null);
  const customerMarkerRef = useRef<any>(null);
  const routeLineRef = useRef<any>(null);
  const routeShadowLineRef = useRef<any>(null);

  const [status, setStatus] = useState<BookingStatus>(initialStatus);
  const [staff, setStaff] = useState<StaffSummary | null>(initialStaff ?? null);
  const [workerPos, setWorkerPos] = useState<{ lat: number; lng: number; heading?: number; speed?: number } | null>(
    () => {
      const stored = getStoredRideState(bookingCode);
      if (stored?.workerLocation) {
        return stored.workerLocation;
      }
      if (initialStaff?.currentLat && initialStaff?.currentLng) {
        return {
          lat: Number(initialStaff.currentLat),
          lng: Number(initialStaff.currentLng),
          heading: initialStaff.lastHeading ?? 0
        };
      }
      return DEMO_RIDE_BOOKING.workerLocation;
    }
  );

  const [etaMinutes, setEtaMinutes] = useState<number | null>(6);
  const [distanceKm, setDistanceKm] = useState<number | null>(2.1);
  const [isConnected, setIsConnected] = useState(false);
  const [lastPingTime, setLastPingTime] = useState<string | null>(null);
  const [isDriving, setIsDriving] = useState(false);

  // Update status internally & notify parent
  const handleStatusUpdate = useCallback(
    (newStatus: BookingStatus, newStaff?: StaffSummary) => {
      setStatus(newStatus);
      if (newStaff) setStaff(newStaff);
      onStatusChange?.(newStatus);
    },
    [onStatusChange]
  );

  // Initialize Leaflet Map
  useEffect(() => {
    let isMounted = true;

    async function initMap() {
      if (typeof window === "undefined" || !mapContainerRef.current || mapInstanceRef.current) return;

      const L = await import("leaflet");
      if (!isMounted || !mapContainerRef.current) return;

      const map = L.map(mapContainerRef.current, {
        center: [customerLocation.lat, customerLocation.lng],
        zoom: 14,
        zoomControl: true,
        attributionControl: false
      });

      mapInstanceRef.current = map;

      // Crisp OpenStreetMap tiles with high contrast
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19
      }).addTo(map);

      // Customer Pin (Uber pickup/destination style with radar ripple)
      const customerIcon = L.divIcon({
        className: "custom-customer-icon",
        html: `
          <div style="position:relative;display:flex;align-items:center;justify-content:center;width:44px;height:44px;">
            <div style="position:absolute;inset:0;border-radius:50%;background:#0284c7;opacity:0.25;animation:ping 2s cubic-bezier(0,0,0.2,1) infinite;"></div>
            <div style="display:flex;align-items:center;justify-content:center;width:38px;height:38px;border-radius:50%;background:#0284c7;color:white;box-shadow:0 4px 14px rgba(2,132,199,0.5);border:3px solid white;z-index:2;">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
              </svg>
            </div>
            <div style="position:absolute;bottom:-20px;left:50%;transform:translateX(-50%);background:#0f172a;color:#fff;font-size:10px;font-weight:700;padding:2px 8px;border-radius:99px;white-space:nowrap;box-shadow:0 2px 6px rgba(0,0,0,0.3);z-index:3;">
              Your Location
            </div>
          </div>
        `,
        iconSize: [44, 44],
        iconAnchor: [22, 22]
      });

      const customerMarker = L.marker([customerLocation.lat, customerLocation.lng], { icon: customerIcon })
        .addTo(map)
        .bindPopup(`<b>${customerName}</b><br/>${customerAddress}`);

      customerMarkerRef.current = customerMarker;

      // Initial Worker Marker
      const initialWorker = workerPos || DEMO_RIDE_BOOKING.workerLocation;
      void updateWorkerMarker(L, map, initialWorker.lat, initialWorker.lng, initialWorker.heading, initialWorker.speed);
    }

    void initMap();

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update Worker Marker position & rotation
  const updateWorkerMarker = async (
    LModule: any,
    map: any,
    lat: number,
    lng: number,
    heading: number = 0,
    speed?: number
  ) => {
    const L = LModule || (await import("leaflet"));
    if (!map) return;

    const workerIcon = L.divIcon({
      className: "custom-worker-vehicle-icon",
      html: `
        <div style="position:relative;display:flex;align-items:center;justify-content:center;width:48px;height:48px;">
          <div style="position:absolute;inset:-4px;border-radius:50%;background:#10b981;opacity:0.2;animation:pulse 2s infinite;"></div>
          <div style="display:flex;align-items:center;justify-content:center;width:42px;height:42px;border-radius:50%;background:#059669;color:white;box-shadow:0 4px 18px rgba(5,150,105,0.6);border:3px solid white;transform:rotate(${heading}deg);transition:transform 0.3s ease-out;z-index:2;">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="12 2 19 21 12 17 5 21 12 2"></polygon>
            </svg>
          </div>
          <div style="position:absolute;bottom:-20px;left:50%;transform:translateX(-50%);background:#065f46;color:#fff;font-size:10px;font-weight:700;padding:2px 7px;border-radius:99px;white-space:nowrap;box-shadow:0 2px 6px rgba(0,0,0,0.3);z-index:3;">
            ${staff?.name?.split(" ")[0] || "Partner"}
          </div>
        </div>
      `,
      iconSize: [48, 48],
      iconAnchor: [24, 24]
    });

    if (workerMarkerRef.current) {
      workerMarkerRef.current.setLatLng([lat, lng]);
      workerMarkerRef.current.setIcon(workerIcon);
    } else {
      const marker = L.marker([lat, lng], { icon: workerIcon }).addTo(map);
      marker.bindPopup(`<b>${staff?.name || "Marac Partner"}</b><br/>En route to your location`);
      workerMarkerRef.current = marker;
    }

    setIsDriving(speed !== undefined && speed > 5);

    // Recalculate route polyline & road ETA
    void fetchRoadRoute(L, map, lat, lng);
  };

  // Fetch driving route via OSRM
  const fetchRoadRoute = async (L: any, map: any, wLat: number, wLng: number) => {
    try {
      const url = `https://router.project-osrm.org/route/v1/driving/${wLng},${wLat};${customerLocation.lng},${customerLocation.lat}?overview=full&geometries=geojson`;
      const res = await fetch(url);
      const data = await res.json();

      if (data.routes && data.routes[0]) {
        const route = data.routes[0];
        const coordinates = route.geometry.coordinates.map((coord: [number, number]) => [coord[1], coord[0]]);

        const minutes = Math.max(1, Math.ceil(route.duration / 60));
        const distance = +(route.distance / 1000).toFixed(1);

        setEtaMinutes(minutes);
        setDistanceKm(distance);

        // Under-glow shadow polyline
        if (routeShadowLineRef.current) {
          routeShadowLineRef.current.setLatLngs(coordinates);
        } else {
          routeShadowLineRef.current = L.polyline(coordinates, {
            color: "#0284c7",
            weight: 8,
            opacity: 0.25
          }).addTo(map);
        }

        // Main polyline
        if (routeLineRef.current) {
          routeLineRef.current.setLatLngs(coordinates);
        } else {
          routeLineRef.current = L.polyline(coordinates, {
            color: "#0284c7",
            weight: 5,
            opacity: 0.9,
            dashArray: "6, 8"
          }).addTo(map);
        }

        // Soft fit bounds to show both customer and worker
        if (map && !map._userPanned) {
          const bounds = L.latLngBounds([[wLat, wLng], [customerLocation.lat, customerLocation.lng]]);
          map.fitBounds(bounds, { padding: [70, 70], maxZoom: 16 });
        }
      }
    } catch {
      // Fallback: Haversine distance
      const dist = calculateDistanceKm(wLat, wLng, customerLocation.lat, customerLocation.lng);
      setDistanceKm(dist);
      setEtaMinutes(Math.max(1, Math.round(dist * 3)));

      if (routeLineRef.current) {
        routeLineRef.current.setLatLngs([
          [wLat, wLng],
          [customerLocation.lat, customerLocation.lng]
        ]);
      } else if (map) {
        routeLineRef.current = L.polyline(
          [
            [wLat, wLng],
            [customerLocation.lat, customerLocation.lng]
          ],
          {
            color: "#0284c7",
            weight: 4,
            opacity: 0.8,
            dashArray: "6, 6"
          }
        ).addTo(map);
      }
    }
  };

  // Cross-Tab & Cross-Window Instant Sync via BroadcastChannel & LocalStorage
  useEffect(() => {
    let bc: BroadcastChannel | null = null;

    if (typeof window !== "undefined" && "BroadcastChannel" in window) {
      bc = new BroadcastChannel(TRACKING_BROADCAST_CHANNEL);
      bc.onmessage = async (event) => {
        if (event.data?.type === "RIDE_UPDATE") {
          const payload = event.data.payload;
          if (payload.bookingCode === bookingCode || bookingCode === "MW-DEMO-RIDE") {
            setLastPingTime(new Date().toLocaleTimeString());
            setIsConnected(true);

            if (payload.status && payload.status !== status) {
              handleStatusUpdate(payload.status);
            }

            if (payload.workerLocation) {
              setWorkerPos(payload.workerLocation);
              if (mapInstanceRef.current) {
                const L = await import("leaflet");
                void updateWorkerMarker(
                  L,
                  mapInstanceRef.current,
                  payload.workerLocation.lat,
                  payload.workerLocation.lng,
                  payload.workerLocation.heading,
                  payload.workerLocation.speed
                );
              }
            }
          }
        }
      };
    }

    const handleStorageEvent = async (e: StorageEvent) => {
      if (e.key && e.key.includes(bookingCode) && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (parsed.workerLocation) {
            setWorkerPos(parsed.workerLocation);
            if (parsed.status) handleStatusUpdate(parsed.status);
            if (mapInstanceRef.current) {
              const L = await import("leaflet");
              void updateWorkerMarker(
                L,
                mapInstanceRef.current,
                parsed.workerLocation.lat,
                parsed.workerLocation.lng,
                parsed.workerLocation.heading,
                parsed.workerLocation.speed
              );
            }
          }
        } catch {
          // ignore
        }
      }
    };

    window.addEventListener("storage", handleStorageEvent);

    return () => {
      bc?.close();
      window.removeEventListener("storage", handleStorageEvent);
    };
  }, [bookingCode, status, handleStatusUpdate]);

  // Realtime Socket Connection
  useEffect(() => {
    let socket: Socket | null = null;

    try {
      socket = io(apiBaseUrl, {
        transports: ["websocket", "polling"],
        reconnectionAttempts: 10,
        reconnectionDelay: 2000
      });

      socket.on("connect", () => {
        setIsConnected(true);
        socket?.emit("join:booking", bookingCode);
      });

      socket.on("disconnect", () => {
        setIsConnected(false);
      });

      // Worker live coordinates update
      socket.on("tracking:update", async (data: TrackingUpdateEvent) => {
        setLastPingTime(new Date().toLocaleTimeString());
        setIsConnected(true);

        const newPos = {
          lat: data.latitude,
          lng: data.longitude,
          heading: data.heading ?? 0,
          speed: data.speed ?? 0
        };

        setWorkerPos(newPos);

        if (mapInstanceRef.current) {
          const L = await import("leaflet");
          void updateWorkerMarker(
            L,
            mapInstanceRef.current,
            data.latitude,
            data.longitude,
            data.heading ?? 0,
            data.speed ?? undefined
          );
        }
      });

      // Booking status change in real time
      socket.on("booking:status_change", (data: { status: BookingStatus; assignedStaff?: StaffSummary }) => {
        handleStatusUpdate(data.status, data.assignedStaff);
      });
    } catch (e) {
      console.warn("Realtime socket connection error", e);
    }

    return () => {
      if (socket) {
        socket.emit("leave:booking", bookingCode);
        socket.disconnect();
      }
    };
  }, [bookingCode, apiBaseUrl, handleStatusUpdate]);

  const fitView = async () => {
    if (!mapInstanceRef.current) return;
    const L = await import("leaflet");
    if (workerPos) {
      const bounds = L.latLngBounds([
        [workerPos.lat, workerPos.lng],
        [customerLocation.lat, customerLocation.lng]
      ]);
      mapInstanceRef.current.fitBounds(bounds, { padding: [60, 60] });
    } else {
      mapInstanceRef.current.setView([customerLocation.lat, customerLocation.lng], 15);
    }
  };

  const getStatusBadge = () => {
    switch (status) {
      case "ASSIGNED":
        return { label: "Partner Assigned", color: "bg-blue-50 text-blue-700 border-blue-200" };
      case "EN_ROUTE":
        return { label: "Heading to Doorstep", color: "bg-amber-50 text-amber-700 border-amber-200 animate-pulse" };
      case "IN_PROGRESS":
        return { label: "Service In Progress", color: "bg-purple-50 text-purple-700 border-purple-200" };
      case "COMPLETED":
        return { label: "Completed", color: "bg-emerald-50 text-emerald-700 border-emerald-200" };
      default:
        return { label: status.replace(/_/g, " "), color: "bg-neutral-50 text-neutral-700 border-neutral-200" };
    }
  };

  const badge = getStatusBadge();

  return (
    <div className="flex flex-col gap-4">
      {/* Car-Booking HUD Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Real-time Status Card */}
        <div className="bg-white rounded-2xl p-4 border border-neutral-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-wider text-neutral-400 font-bold">Ride & Service Status</p>
            <div className="flex items-center gap-2 mt-1">
              <span className={`px-2.5 py-1 text-xs font-bold rounded-lg border ${badge.color}`}>
                {badge.label}
              </span>
            </div>
          </div>
          <div className="flex flex-col items-end">
            <div className="flex items-center gap-1.5">
              <span className={`w-2.5 h-2.5 rounded-full ${isConnected ? "bg-emerald-500 animate-ping" : "bg-emerald-500"}`} />
              <span className="text-xs font-semibold text-emerald-600">
                {isDriving ? "Moving (GPS Active)" : "Connected"}
              </span>
            </div>
            {lastPingTime && <span className="text-[10px] text-neutral-400 mt-1">Ping: {lastPingTime}</span>}
          </div>
        </div>

        {/* Live Arrival ETA Card (Uber style) */}
        <div className="bg-white rounded-2xl p-4 border border-neutral-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-wider text-neutral-400 font-bold">Estimated Arrival</p>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl font-black text-neutral-900 tracking-tight">
                {status === "COMPLETED" ? (
                  "Completed"
                ) : etaMinutes !== null && etaMinutes > 0 ? (
                  `${etaMinutes} min${etaMinutes > 1 ? "s" : ""}`
                ) : (
                  "Arriving Now"
                )}
              </span>
              {distanceKm !== null && status !== "COMPLETED" && (
                <span className="text-xs font-semibold text-neutral-500">
                  ({distanceKm} km away)
                </span>
              )}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center text-lg">
            🚗
          </div>
        </div>

        {/* Assigned Worker Partner Card */}
        <div className="bg-white rounded-2xl p-4 border border-neutral-200/80 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-neutral-900 text-white flex items-center justify-center font-bold text-sm shadow-md shadow-neutral-900/10">
              {staff?.name ? staff.name.charAt(0).toUpperCase() : "B"}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <p className="text-sm font-bold text-neutral-900 leading-tight">
                  {staff?.name || DEMO_RIDE_BOOKING.worker.name}
                </p>
                <span className="text-[10px] font-bold px-1.5 py-0.5 bg-amber-50 text-amber-700 rounded border border-amber-200/60">
                  ★ 4.9
                </span>
              </div>
              <p className="text-xs text-neutral-500">
                {staff?.role || DEMO_RIDE_BOOKING.worker.trade}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <a
              href={`tel:${staff?.phone || "9365123456"}`}
              className="p-2.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-800 transition"
              title="Call partner"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
            </a>
          </div>
        </div>
      </div>

      {/* Main Interactive Map Canvas */}
      <div className="relative w-full h-[450px] md:h-[520px] rounded-3xl overflow-hidden border border-neutral-200/90 shadow-xl bg-neutral-100">
        <div ref={mapContainerRef} className="w-full h-full z-0" />

        {/* Top-Left Floating Badge: Car-Booking Style Status */}
        <div className="absolute top-4 left-4 z-[500] bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-2xl shadow-lg border border-neutral-200/90 flex items-center gap-2.5">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </span>
          <div className="flex flex-col">
            <span className="text-[11px] font-bold text-neutral-900 leading-none">
              Car-Booking Live Tracking
            </span>
            <span className="text-[9px] text-neutral-500 font-medium">
              Mutual real-time GPS stream
            </span>
          </div>
        </div>

        {/* Top-Right Floating Switcher: Jump to Worker Seat */}
        {onSwitchToWorkerMode && (
          <div className="absolute top-4 right-4 z-[500]">
            <button
              type="button"
              onClick={onSwitchToWorkerMode}
              className="px-3.5 py-2 bg-neutral-900 text-white text-xs font-bold rounded-2xl shadow-xl hover:bg-neutral-800 transition flex items-center gap-2 border border-neutral-700"
              title="Drive this trip as the worker"
            >
              <span>🦺 Switch to Worker Seat</span>
              <span className="px-1.5 py-0.5 rounded bg-amber-400 text-neutral-900 text-[10px] font-black">
                Driver Mode
              </span>
            </button>
          </div>
        )}

        {/* Bottom-Right Controls: Re-center & Map Legend */}
        <div className="absolute bottom-4 right-4 z-[500] flex flex-col items-end gap-2">
          <div className="bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl shadow border border-neutral-200 text-[11px] flex items-center gap-3">
            <div className="flex items-center gap-1.5 font-bold text-emerald-700">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span>Partner</span>
            </div>
            <div className="flex items-center gap-1.5 font-bold text-sky-700">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-600" />
              <span>You</span>
            </div>
          </div>

          <button
            type="button"
            onClick={fitView}
            className="p-3 bg-white/95 backdrop-blur-md rounded-2xl shadow-lg border border-neutral-200 text-neutral-800 hover:bg-white transition flex items-center gap-2 text-xs font-bold"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="12" cy="12" r="10" />
              <line x1="22" y1="12" x2="18" y2="12" />
              <line x1="6" y1="12" x2="2" y2="12" />
              <line x1="12" y1="6" x2="12" y2="2" />
              <line x1="12" y1="22" x2="12" y2="18" />
            </svg>
            Re-center
          </button>
        </div>
      </div>
    </div>
  );
}
