"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import type { BookingStatus } from "@the-wings/types";
import { createApiClient } from "@the-wings/api-client";
import {
  calculateBearing,
  calculateDistanceKm,
  estimateEtaMinutes,
  broadcastRideState,
  getStoredRideState,
  GUWAHATI_DEFAULT_COORDS
} from "@/lib/trackingSync";

export interface WorkerConsoleProps {
  bookingCode: string;
  customerName: string;
  customerAddress: string;
  customerLocation: { lat: number; lng: number };
  customerPhone?: string;
  serviceTitle?: string;
  fareAmount?: number;
  initialStatus?: BookingStatus;
  apiBaseUrl: string;
  onSwitchToCustomerView?: () => void;
}

export default function WorkerConsole({
  bookingCode,
  customerName,
  customerAddress,
  customerLocation,
  customerPhone = "",
  serviceTitle = "Home Service Dispatch",
  fareAmount = 350,
  initialStatus = "ASSIGNED",
  apiBaseUrl,
  onSwitchToCustomerView
}: WorkerConsoleProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const workerMarkerRef = useRef<any>(null);
  const customerMarkerRef = useRef<any>(null);
  const routeLineRef = useRef<any>(null);
  const watchIdRef = useRef<number | null>(null);

  const [isOnline, setIsOnline] = useState(true);
  const [currentStatus, setCurrentStatus] = useState<BookingStatus>(() => {
    const stored = getStoredRideState(bookingCode);
    return stored?.status || initialStatus;
  });

  const [workerPos, setWorkerPos] = useState<{ lat: number; lng: number; heading: number; speed?: number } | null>(() => {
    const stored = getStoredRideState(bookingCode);
    return stored?.workerLocation || null;
  });

  const [isGpsActive, setIsGpsActive] = useState(false);
  const [distanceRemaining, setDistanceRemaining] = useState<number | null>(null);
  const [etaRemaining, setEtaRemaining] = useState<number | null>(null);
  const [socketConnected, setSocketConnected] = useState(false);
  const [lastBroadcastTime, setLastBroadcastTime] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const socketRef = useRef<Socket | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Socket.IO Realtime Connection
  useEffect(() => {
    try {
      const socket = io(apiBaseUrl, {
        transports: ["websocket", "polling"],
        reconnectionAttempts: 10,
        reconnectionDelay: 2000
      });
      socketRef.current = socket;

      socket.on("connect", () => {
        setSocketConnected(true);
        socket.emit("join:booking", bookingCode);
      });

      socket.on("disconnect", () => {
        setSocketConnected(false);
      });

      return () => {
        socket.emit("leave:booking", bookingCode);
        socket.disconnect();
      };
    } catch (err) {
      console.warn("Worker socket connection error", err);
    }
  }, [bookingCode, apiBaseUrl]);

  // Broadcast location to API, WebSocket, and Local Cross-Tab Channel
  const broadcastLocationUpdate = useCallback(
    (lat: number, lng: number, heading: number, speed: number = 0) => {
      setLastBroadcastTime(new Date().toLocaleTimeString());

      // 1. Broadcast via WebSocket
      if (socketRef.current?.connected) {
        socketRef.current.emit("worker:update_loc", {
          bookingId: bookingCode,
          latitude: lat,
          longitude: lng,
          heading,
          speed,
          timestamp: new Date().toISOString()
        });
      }

      // 2. Broadcast via Local BroadcastChannel
      broadcastRideState({
        bookingCode,
        status: currentStatus,
        customerName,
        customerAddress,
        customerLocation,
        workerLocation: { lat, lng, heading, speed },
        etaMinutes: etaRemaining,
        distanceKm: distanceRemaining
      });

      // 3. Persist to API database in background
      try {
        createApiClient()
          .updateWorkerLocation(bookingCode, {
            latitude: lat,
            longitude: lng,
            heading,
            speed
          })
          .catch(() => null);
      } catch {
        // ignore
      }
    },
    [bookingCode, currentStatus, customerName, customerAddress, customerLocation, etaRemaining, distanceRemaining]
  );

  // Status update handler (saved to database and notified in realtime)
  const updateStatus = useCallback(
    async (newStatus: BookingStatus, note?: string) => {
      setIsUpdatingStatus(true);
      setCurrentStatus(newStatus);
      triggerToast(`Status updated to ${newStatus.replace(/_/g, " ")}`);

      // 1. Socket.IO
      if (socketRef.current?.connected) {
        socketRef.current.emit("worker:update_status", {
          bookingId: bookingCode,
          status: newStatus,
          note
        });
      }

      // 2. BroadcastChannel
      broadcastRideState({
        bookingCode,
        status: newStatus,
        customerName,
        customerAddress,
        customerLocation,
        workerLocation: workerPos,
        etaMinutes: newStatus === "COMPLETED" ? 0 : etaRemaining,
        distanceKm: newStatus === "COMPLETED" ? 0 : distanceRemaining
      });

      // 3. Database API
      try {
        await createApiClient().updatePartnerBookingStatus(bookingCode, {
          status: newStatus,
          note
        });
      } catch {
        // ignore
      } finally {
        setIsUpdatingStatus(false);
      }
    },
    [bookingCode, workerPos, customerName, customerAddress, customerLocation, etaRemaining, distanceRemaining]
  );

  // Move marker on Leaflet map
  const moveMapMarker = async (lat: number, lng: number, heading: number) => {
    if (!workerMarkerRef.current || !mapInstanceRef.current) return;
    const L = await import("leaflet");

    const workerIcon = L.divIcon({
      className: "worker-driver-icon",
      html: `
        <div style="position:relative;display:flex;align-items:center;justify-content:center;width:48px;height:48px;">
          <div style="position:absolute;inset:-4px;border-radius:50%;background:#10b981;opacity:0.3;animation:pulse 2s infinite;"></div>
          <div style="display:flex;align-items:center;justify-content:center;width:42px;height:42px;border-radius:50%;background:#059669;color:white;box-shadow:0 4px 18px rgba(5,150,105,0.6);border:3px solid white;transform:rotate(${heading}deg);transition:transform 0.25s ease-out;z-index:2;">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="12 2 19 21 12 17 5 21 12 2"></polygon>
            </svg>
          </div>
          <div style="position:absolute;bottom:-20px;left:50%;transform:translateX(-50%);background:#065f46;color:#fff;font-size:10px;font-weight:700;padding:2px 7px;border-radius:99px;white-space:nowrap;box-shadow:0 2px 6px rgba(0,0,0,0.3);z-index:3;">
            You (GPS)
          </div>
        </div>
      `,
      iconSize: [48, 48],
      iconAnchor: [24, 24]
    });

    workerMarkerRef.current.setLatLng([lat, lng]);
    workerMarkerRef.current.setIcon(workerIcon);

    // Pan map to follow worker
    mapInstanceRef.current.panTo([lat, lng], { animate: true, duration: 0.5 });
  };

  // Start continuous real-device GPS tracking
  const startRealGpsTracking = useCallback(() => {
    if (!navigator.geolocation) {
      triggerToast("Geolocation is not supported on this device/browser");
      return;
    }

    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }

    setIsGpsActive(true);
    triggerToast("Live GPS tracking active. Streaming coordinates to customer.");

    let lastLat: number | null = null;
    let lastLng: number | null = null;

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        let heading = pos.coords.heading || 0;

        if (!heading && lastLat !== null && lastLng !== null) {
          heading = Math.round(calculateBearing(lastLat, lastLng, lat, lng));
        }

        const speed = pos.coords.speed ? +(pos.coords.speed * 3.6).toFixed(1) : 0;
        lastLat = lat;
        lastLng = lng;

        const newPos = { lat, lng, heading, speed };
        setWorkerPos(newPos);
        void moveMapMarker(lat, lng, heading);
        broadcastLocationUpdate(lat, lng, heading, speed);

        const cLat = customerLocation.lat || GUWAHATI_DEFAULT_COORDS.lat;
        const cLng = customerLocation.lng || GUWAHATI_DEFAULT_COORDS.lng;
        const dist = calculateDistanceKm(lat, lng, cLat, cLng);
        setDistanceRemaining(dist);
        setEtaRemaining(estimateEtaMinutes(dist, speed || 25));
      },
      (err) => {
        console.warn("GPS error", err);
        triggerToast("Please grant location permission to stream live GPS");
      },
      {
        enableHighAccuracy: true,
        maximumAge: 2000,
        timeout: 10000
      }
    );
  }, [customerLocation, broadcastLocationUpdate]);

  // Stop GPS tracking
  const stopRealGpsTracking = useCallback(() => {
    if (watchIdRef.current !== null && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsGpsActive(false);
    triggerToast("Live GPS broadcasting paused");
  }, []);

  // Initialize Leaflet Driver Map
  useEffect(() => {
    let isMounted = true;

    async function initMap() {
      if (typeof window === "undefined" || !mapContainerRef.current || mapInstanceRef.current) return;
      const L = await import("leaflet");
      if (!isMounted || !mapContainerRef.current) return;

      const cLat = customerLocation.lat || GUWAHATI_DEFAULT_COORDS.lat;
      const cLng = customerLocation.lng || GUWAHATI_DEFAULT_COORDS.lng;
      const initialLat = workerPos?.lat || cLat + 0.015;
      const initialLng = workerPos?.lng || cLng + 0.015;

      const map = L.map(mapContainerRef.current, {
        center: [initialLat, initialLng],
        zoom: 14,
        zoomControl: true,
        attributionControl: false
      });

      mapInstanceRef.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19
      }).addTo(map);

      // Customer Doorstep Destination Pin
      const customerIcon = L.divIcon({
        className: "worker-dest-icon",
        html: `
          <div style="position:relative;display:flex;align-items:center;justify-content:center;width:44px;height:44px;">
            <div style="position:absolute;inset:0;border-radius:50%;background:#0284c7;opacity:0.3;animation:ping 2s cubic-bezier(0,0,0.2,1) infinite;"></div>
            <div style="display:flex;align-items:center;justify-content:center;width:38px;height:38px;border-radius:50%;background:#0284c7;color:white;box-shadow:0 4px 14px rgba(2,132,199,0.5);border:3px solid white;z-index:2;">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
              </svg>
            </div>
            <div style="position:absolute;bottom:-20px;left:50%;transform:translateX(-50%);background:#0f172a;color:#fff;font-size:10px;font-weight:700;padding:2px 8px;border-radius:99px;white-space:nowrap;box-shadow:0 2px 6px rgba(0,0,0,0.3);z-index:3;">
              Customer Doorstep
            </div>
          </div>
        `,
        iconSize: [44, 44],
        iconAnchor: [22, 22]
      });

      const cMarker = L.marker([cLat, cLng], { icon: customerIcon })
        .addTo(map)
        .bindPopup(`<b>${customerName}</b><br/>${customerAddress}`);
      customerMarkerRef.current = cMarker;

      // Worker Vehicle Pin
      const workerIcon = L.divIcon({
        className: "worker-driver-icon",
        html: `
          <div style="position:relative;display:flex;align-items:center;justify-content:center;width:48px;height:48px;">
            <div style="position:absolute;inset:-4px;border-radius:50%;background:#10b981;opacity:0.3;animation:pulse 2s infinite;"></div>
            <div style="display:flex;align-items:center;justify-content:center;width:42px;height:42px;border-radius:50%;background:#059669;color:white;box-shadow:0 4px 18px rgba(5,150,105,0.6);border:3px solid white;transform:rotate(${workerPos?.heading || 0}deg);transition:transform 0.25s ease-out;z-index:2;">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="12 2 19 21 12 17 5 21 12 2"></polygon>
              </svg>
            </div>
            <div style="position:absolute;bottom:-20px;left:50%;transform:translateX(-50%);background:#065f46;color:#fff;font-size:10px;font-weight:700;padding:2px 7px;border-radius:99px;white-space:nowrap;box-shadow:0 2px 6px rgba(0,0,0,0.3);z-index:3;">
              You (GPS)
            </div>
          </div>
        `,
        iconSize: [48, 48],
        iconAnchor: [24, 24]
      });

      const wMarker = L.marker([initialLat, initialLng], { icon: workerIcon }).addTo(map);
      workerMarkerRef.current = wMarker;

      // Initial route line
      routeLineRef.current = L.polyline([[initialLat, initialLng], [cLat, cLng]], {
        color: "#059669",
        weight: 5,
        opacity: 0.85,
        dashArray: "6, 8"
      }).addTo(map);

      // Fit bounds
      const bounds = L.latLngBounds([[initialLat, initialLng], [cLat, cLng]]);
      map.fitBounds(bounds, { padding: [60, 60] });
    }

    void initMap();

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
      if (watchIdRef.current !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  // Action flow transitions
  const handleStartTrip = () => {
    updateStatus("EN_ROUTE", "Partner started driving to customer location");
    startRealGpsTracking();
  };

  const handleArrived = () => {
    updateStatus("IN_PROGRESS", "Partner arrived at customer doorstep");
  };

  const handleComplete = () => {
    stopRealGpsTracking();
    updateStatus("COMPLETED", "Job completed successfully");
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-[9999] bg-neutral-900 text-white px-5 py-3 rounded-2xl shadow-2xl text-xs font-bold border border-neutral-700 animate-bounce flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Driver Cockpit Top Bar */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-neutral-200/90 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-14 h-14 rounded-2xl bg-neutral-900 text-white flex items-center justify-center font-black text-xl shadow-lg shadow-neutral-900/15">
              P
            </div>
            <span
              className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
                isOnline ? "bg-emerald-500" : "bg-neutral-400"
              }`}
            />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-black text-neutral-900">
                Partner Console
              </h2>
              <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[11px] font-bold rounded-md border border-emerald-200">
                Verified Technician
              </span>
            </div>
            <p className="text-xs text-neutral-500 font-medium">
              Realtime GPS Dispatch • Booking #{bookingCode}
            </p>
          </div>
        </div>

        {/* Status & Availability Controls */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Online Toggle */}
          <button
            type="button"
            onClick={() => {
              setIsOnline(!isOnline);
              triggerToast(!isOnline ? "You are now ONLINE for bookings" : "You are now OFFLINE");
            }}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition flex items-center gap-2 border ${
              isOnline
                ? "bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100"
                : "bg-neutral-100 text-neutral-600 border-neutral-300 hover:bg-neutral-200"
            }`}
          >
            <span className={`w-2.5 h-2.5 rounded-full ${isOnline ? "bg-emerald-500 animate-pulse" : "bg-neutral-400"}`} />
            <span>{isOnline ? "Duty: Online" : "Duty: Offline"}</span>
          </button>

          {/* Real GPS Broadcast Toggle */}
          <button
            type="button"
            onClick={() => {
              if (isGpsActive) {
                stopRealGpsTracking();
              } else {
                startRealGpsTracking();
              }
            }}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition flex items-center gap-1.5 border ${
              isGpsActive
                ? "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20 animate-pulse"
                : "bg-neutral-100 text-neutral-700 border-neutral-300 hover:bg-neutral-200"
            }`}
          >
            <span>📡</span>
            <span>{isGpsActive ? "Live GPS Active" : "Broadcast My GPS"}</span>
          </button>

          {/* Switch to Customer View */}
          {onSwitchToCustomerView && (
            <button
              type="button"
              onClick={onSwitchToCustomerView}
              className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-2xl text-xs font-bold transition flex items-center gap-1.5"
            >
              <span>👤 View Customer Tracking</span>
            </button>
          )}
        </div>
      </div>

      {/* Active Trip Banner */}
      <div className="bg-gradient-to-r from-neutral-900 via-neutral-800 to-neutral-950 text-white rounded-3xl p-5 sm:p-6 shadow-xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-neutral-800">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[11px] font-bold">
                ASSIGNED JOB
              </span>
              <span className="text-xs font-mono text-neutral-400 font-bold">
                #{bookingCode}
              </span>
            </div>
            <h3 className="text-lg sm:text-xl font-black text-white">{serviceTitle}</h3>
            <p className="text-xs text-neutral-400 mt-0.5 flex items-center gap-1.5">
              <span>📍 {customerAddress}</span>
            </p>
          </div>

          <div className="flex flex-col items-start md:items-end bg-neutral-800/80 px-4 py-2.5 rounded-2xl border border-neutral-700/80">
            <span className="text-[10px] uppercase font-bold text-neutral-400">Total Payout</span>
            <span className="text-xl font-black text-emerald-400">₹{fareAmount}</span>
            <span className="text-[10px] text-neutral-400">Collect on completion</span>
          </div>
        </div>

        {/* Customer Contact Strip */}
        <div className="pt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-neutral-800 text-sky-400 flex items-center justify-center font-bold">
              👤
            </div>
            <div>
              <span className="font-bold text-white text-sm">{customerName}</span>
              {customerPhone && <p className="text-neutral-400">{customerPhone}</p>}
            </div>
          </div>

          {customerPhone && (
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <a
                href={`tel:${customerPhone}`}
                className="flex-1 sm:flex-initial px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl font-bold transition flex items-center justify-center gap-1.5 text-xs"
              >
                📞 Call Customer
              </a>
              <a
                href={`https://wa.me/91${customerPhone.replace(/\D/g, "")}?text=${encodeURIComponent(
                  `Hello ${customerName}, I am your technician from Marac Workers. I am heading to your location for ${serviceTitle}.`
                )}`}
                target="_blank"
                rel="noreferrer"
                className="flex-1 sm:flex-initial px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold transition flex items-center justify-center gap-1.5 text-xs"
              >
                💬 WhatsApp
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Production Driver Actions */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-neutral-200/90 shadow-sm">
        <p className="text-xs uppercase font-black tracking-wider text-neutral-400 mb-3">
          Driver Execution Workflow
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Step 1: Start Trip */}
          <button
            type="button"
            onClick={handleStartTrip}
            disabled={isUpdatingStatus || currentStatus === "EN_ROUTE" || currentStatus === "IN_PROGRESS" || currentStatus === "COMPLETED"}
            className={`p-4 rounded-2xl font-bold text-xs transition flex flex-col items-center justify-center text-center gap-2 ${
              currentStatus === "ASSIGNED" || currentStatus === "CONFIRMED" || currentStatus === "PENDING"
                ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/30 ring-4 ring-emerald-500/20 scale-[1.01]"
                : currentStatus === "EN_ROUTE"
                ? "bg-emerald-50 text-emerald-800 border border-emerald-300"
                : "bg-neutral-100 text-neutral-400 cursor-not-allowed"
            }`}
          >
            <span className="text-xl">🚀</span>
            <div>
              <span className="block text-sm font-black">1. Start Trip</span>
              <span className="text-[10px] opacity-80">Drive to Customer</span>
            </div>
          </button>

          {/* Step 2: Arrived at Doorstep */}
          <button
            type="button"
            onClick={handleArrived}
            disabled={isUpdatingStatus || currentStatus !== "EN_ROUTE"}
            className={`p-4 rounded-2xl font-bold text-xs transition flex flex-col items-center justify-center text-center gap-2 ${
              currentStatus === "EN_ROUTE"
                ? "bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/30 ring-4 ring-amber-500/20 animate-pulse"
                : currentStatus === "IN_PROGRESS" || currentStatus === "COMPLETED"
                ? "bg-amber-50 text-amber-800 border border-amber-300"
                : "bg-neutral-100 text-neutral-400 cursor-not-allowed"
            }`}
          >
            <span className="text-xl">📍</span>
            <div>
              <span className="block text-sm font-black">2. Arrived at Location</span>
              <span className="text-[10px] opacity-80">Begin service inspection</span>
            </div>
          </button>

          {/* Step 3: Complete Service */}
          <button
            type="button"
            onClick={handleComplete}
            disabled={isUpdatingStatus || currentStatus !== "IN_PROGRESS"}
            className={`p-4 rounded-2xl font-bold text-xs transition flex flex-col items-center justify-center text-center gap-2 ${
              currentStatus === "IN_PROGRESS"
                ? "bg-neutral-900 hover:bg-neutral-800 text-white shadow-lg shadow-neutral-900/30 ring-4 ring-neutral-700/20"
                : currentStatus === "COMPLETED"
                ? "bg-emerald-600 text-white shadow"
                : "bg-neutral-100 text-neutral-400 cursor-not-allowed"
            }`}
          >
            <span className="text-xl">✅</span>
            <div>
              <span className="block text-sm font-black">3. Complete Service</span>
              <span className="text-[10px] opacity-80">Collect ₹{fareAmount}</span>
            </div>
          </button>
        </div>
      </div>

      {/* Driver Map */}
      <div className="relative w-full h-[450px] md:h-[500px] rounded-3xl overflow-hidden border border-neutral-200/90 shadow-xl bg-neutral-100">
        <div ref={mapContainerRef} className="w-full h-full z-0" />

        {/* Turn Guidance Top Banner */}
        <div className="absolute top-4 left-4 right-4 z-[500] max-w-md mx-auto bg-neutral-900/95 backdrop-blur-md text-white p-3.5 rounded-2xl shadow-2xl border border-neutral-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-bold text-lg">
              ↑
            </div>
            <div>
              <p className="text-xs font-bold leading-tight">
                {currentStatus === "COMPLETED"
                  ? "Service completed successfully"
                  : currentStatus === "IN_PROGRESS"
                  ? "Service execution in progress"
                  : isGpsActive
                  ? "Live GPS tracking active on route"
                  : "Click Start Trip or Broadcast GPS"}
              </p>
              <p className="text-[11px] text-neutral-400">
                Destination: {customerAddress.split(",")[0]}
              </p>
            </div>
          </div>

          <div className="text-right border-l border-neutral-700 pl-3">
            <span className="text-base font-black text-emerald-400 block leading-tight">
              {currentStatus === "COMPLETED" ? "Done" : distanceRemaining !== null ? `${distanceRemaining} km` : "--"}
            </span>
            <span className="text-[10px] text-neutral-400">
              {currentStatus === "COMPLETED" ? "Paid" : etaRemaining !== null ? `${etaRemaining} mins` : "--"}
            </span>
          </div>
        </div>

        {/* Telemetry info bar */}
        <div className="absolute bottom-4 left-4 z-[500] bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-2xl shadow-lg border border-neutral-200 text-xs flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-bold">
            <span className={`w-2.5 h-2.5 rounded-full ${socketConnected ? "bg-emerald-500 animate-pulse" : "bg-neutral-400"}`} />
            <span className="text-neutral-900">
              {socketConnected ? "Telemetry Connected" : "Connecting..."}
            </span>
          </div>
          {lastBroadcastTime && (
            <span className="text-neutral-500 text-[11px] hidden sm:inline">
              Last synced: {lastBroadcastTime}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
