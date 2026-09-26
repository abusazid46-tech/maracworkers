"use client";

import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import type { BookingStatus, StaffSummary, TrackingUpdateEvent } from "@the-wings/types";

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
}

export default function TrackingMap({
  bookingCode,
  customerName,
  customerAddress,
  customerLocation,
  initialStatus,
  initialStaff,
  apiBaseUrl,
  onStatusChange
}: TrackingMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const workerMarkerRef = useRef<any>(null);
  const customerMarkerRef = useRef<any>(null);
  const routeLineRef = useRef<any>(null);

  const [status, setStatus] = useState<BookingStatus>(initialStatus);
  const [staff, setStaff] = useState<StaffSummary | null>(initialStaff ?? null);
  const [workerPos, setWorkerPos] = useState<{ lat: number; lng: number; heading?: number } | null>(
    initialStaff?.currentLat && initialStaff?.currentLng
      ? {
          lat: Number(initialStaff.currentLat),
          lng: Number(initialStaff.currentLng),
          heading: initialStaff.lastHeading ?? undefined
        }
      : null
  );

  const [etaMinutes, setEtaMinutes] = useState<number | null>(null);
  const [distanceKm, setDistanceKm] = useState<number | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastPingTime, setLastPingTime] = useState<string | null>(null);

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

      // Clean OpenStreetMap tiles
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19
      }).addTo(map);

      // Customer Pin (Blue with radar pulse)
      const customerIcon = L.divIcon({
        className: "custom-customer-icon",
        html: `
          <div style="display:flex;align-items:center;justify-content:center;width:40px;height:40px;border-radius:50%;background:#0284c7;color:white;box-shadow:0 4px 12px rgba(2,132,199,0.45);border:3px solid white;position:relative;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 010-5 2.5 2.5 0 010 5z"/>
            </svg>
            <div style="position:absolute;inset:-6px;border-radius:50%;border:2px solid #0284c7;opacity:0.6;animation:ping 2s cubic-bezier(0,0,0.2,1) infinite;"></div>
          </div>
        `,
        iconSize: [40, 40],
        iconAnchor: [20, 20]
      });

      const customerMarker = L.marker([customerLocation.lat, customerLocation.lng], { icon: customerIcon })
        .addTo(map)
        .bindPopup(`<b>${customerName}</b><br/>${customerAddress}`);

      customerMarkerRef.current = customerMarker;

      // If initial worker position exists, create marker
      if (workerPos) {
        updateWorkerMarker(L, map, workerPos.lat, workerPos.lng, workerPos.heading);
      }
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

  // Update or create worker marker
  const updateWorkerMarker = async (
    LModule: any,
    map: any,
    lat: number,
    lng: number,
    heading?: number
  ) => {
    const L = LModule || (await import("leaflet"));

    const workerIcon = L.divIcon({
      className: "custom-worker-icon",
      html: `
        <div style="display:flex;align-items:center;justify-content:center;width:44px;height:44px;border-radius:50%;background:#059669;color:white;box-shadow:0 4px 16px rgba(5,150,105,0.5);border:3px solid white;transform: rotate(${heading || 0}deg);transition: transform 0.4s ease;">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
            <polygon points="12 2 19 21 12 17 5 21 12 2"></polygon>
          </svg>
        </div>
      `,
      iconSize: [44, 44],
      iconAnchor: [22, 22]
    });

    if (workerMarkerRef.current) {
      workerMarkerRef.current.setLatLng([lat, lng]);
      workerMarkerRef.current.setIcon(workerIcon);
    } else if (map) {
      const marker = L.marker([lat, lng], { icon: workerIcon }).addTo(map);
      marker.bindPopup(`<b>${staff?.name || "Service Professional"}</b><br/>En route to your location`);
      workerMarkerRef.current = marker;
    }

    // Update Route Line & ETA
    fetchRoadRoute(L, map, lat, lng);
  };

  // Fetch driving route and ETA via OSRM
  const fetchRoadRoute = async (L: any, map: any, wLat: number, wLng: number) => {
    try {
      const url = `https://router.project-osrm.org/route/v1/driving/${wLng},${wLat};${customerLocation.lng},${customerLocation.lat}?overview=full&geometries=geojson`;
      const res = await fetch(url);
      const data = await res.json();

      if (data.routes && data.routes[0]) {
        const route = data.routes[0];
        const coordinates = route.geometry.coordinates.map((coord: [number, number]) => [coord[1], coord[0]]);

        const minutes = Math.ceil(route.duration / 60);
        const distance = +(route.distance / 1000).toFixed(1);

        setEtaMinutes(minutes);
        setDistanceKm(distance);

        if (routeLineRef.current) {
          routeLineRef.current.setLatLngs(coordinates);
        } else {
          routeLineRef.current = L.polyline(coordinates, {
            color: "#0284c7",
            weight: 5,
            opacity: 0.85,
            dashArray: "8, 8"
          }).addTo(map);
        }

        // Fit map bounds to show both points with comfort padding
        if (map) {
          const bounds = L.latLngBounds([[wLat, wLng], [customerLocation.lat, customerLocation.lng]]);
          map.fitBounds(bounds, { padding: [60, 60], maxZoom: 16 });
        }
      }
    } catch {
      // Fallback straight line if OSRM is unreachable
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
            opacity: 0.7,
            dashArray: "6, 6"
          }
        ).addTo(map);
      }
    }
  };

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
        setWorkerPos({
          lat: data.latitude,
          lng: data.longitude,
          heading: data.heading ?? undefined
        });

        if (mapInstanceRef.current) {
          const L = await import("leaflet");
          void updateWorkerMarker(L, mapInstanceRef.current, data.latitude, data.longitude, data.heading ?? undefined);
        }
      });

      // Booking status change in real time
      socket.on("booking:status_change", (data: { status: BookingStatus; assignedStaff?: StaffSummary }) => {
        setStatus(data.status);
        if (data.assignedStaff) {
          setStaff(data.assignedStaff);
        }
        onStatusChange?.(data.status);
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
  }, [bookingCode, apiBaseUrl]);

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

  return (
    <div className="flex flex-col gap-4">
      {/* Realtime Status Bar & ETA Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Status Pill */}
        <div className="bg-white rounded-2xl p-4 border border-neutral-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wider text-neutral-400 font-semibold">Service Status</p>
            <p className="text-lg font-bold text-neutral-900 capitalize">
              {status.replace(/_/g, " ").toLowerCase()}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`w-3 h-3 rounded-full ${
                isConnected ? "bg-emerald-500 animate-pulse" : "bg-amber-400"
              }`}
            />
            <span className="text-xs text-neutral-500 font-medium">
              {isConnected ? "Live GPS" : "Connecting..."}
            </span>
          </div>
        </div>

        {/* ETA Card */}
        <div className="bg-white rounded-2xl p-4 border border-neutral-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wider text-neutral-400 font-semibold">Estimated Arrival</p>
            <p className="text-xl font-black text-emerald-600">
              {etaMinutes !== null ? (
                `${etaMinutes} min${etaMinutes > 1 ? "s" : ""}`
              ) : workerPos ? (
                "Calculating..."
              ) : (
                "Awaiting departure"
              )}
            </p>
          </div>
          {distanceKm !== null && (
            <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-lg">
              {distanceKm} km away
            </span>
          )}
        </div>

        {/* Worker Card */}
        <div className="bg-white rounded-2xl p-4 border border-neutral-200/80 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-base">
              {staff?.name ? staff.name.charAt(0).toUpperCase() : "W"}
            </div>
            <div>
              <p className="text-sm font-bold text-neutral-900">{staff?.name || "Assigned Partner"}</p>
              <p className="text-xs text-neutral-500">{staff?.role || "Field Technician"}</p>
            </div>
          </div>
          {staff?.phone && (
            <a
              href={`tel:${staff.phone}`}
              className="p-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-700 transition"
              title="Call partner"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
            </a>
          )}
        </div>
      </div>

      {/* Map Container */}
      <div className="relative w-full h-[450px] md:h-[500px] rounded-3xl overflow-hidden border border-neutral-200/90 shadow-lg bg-neutral-100">
        <div ref={mapContainerRef} className="w-full h-full z-0" />

        {/* Floating Controls */}
        <div className="absolute bottom-4 right-4 z-[500] flex flex-col gap-2">
          <button
            type="button"
            onClick={fitView}
            className="p-3 bg-white/95 backdrop-blur-md rounded-2xl shadow-lg border border-neutral-200 text-neutral-700 hover:bg-white transition flex items-center gap-1.5 text-xs font-semibold"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="22" y1="12" x2="18" y2="12" />
              <line x1="6" y1="12" x2="2" y2="12" />
              <line x1="12" y1="6" x2="12" y2="2" />
              <line x1="12" y1="22" x2="12" y2="18" />
            </svg>
            Re-center
          </button>
        </div>

        {/* Legend Overlay */}
        <div className="absolute top-4 right-4 z-[500] bg-white/90 backdrop-blur-md px-3 py-2 rounded-2xl shadow border border-neutral-200 text-xs flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />
            <span className="text-neutral-700 font-medium">Worker</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-sky-600 inline-block" />
            <span className="text-neutral-700 font-medium">You</span>
          </div>
          {lastPingTime && (
            <span className="text-neutral-400 border-l pl-2 text-[10px]">
              Last ping: {lastPingTime}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
