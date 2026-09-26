"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import type { BookingStatus } from "@the-wings/types";
import { createApiClient } from "@the-wings/api-client";
import {
  DEMO_RIDE_BOOKING,
  calculateBearing,
  calculateDistanceKm,
  broadcastRideState,
  getStoredRideState
} from "@/lib/trackingSync";

export interface WorkerConsoleProps {
  bookingCode?: string;
  customerName?: string;
  customerAddress?: string;
  customerLocation?: { lat: number; lng: number };
  customerPhone?: string;
  serviceTitle?: string;
  fareAmount?: number;
  apiBaseUrl: string;
  onSwitchToCustomerView?: () => void;
  onSwitchToSplitView?: () => void;
}

export default function WorkerConsole({
  bookingCode = DEMO_RIDE_BOOKING.bookingCode,
  customerName = DEMO_RIDE_BOOKING.customerName,
  customerAddress = DEMO_RIDE_BOOKING.customerAddress,
  customerLocation = DEMO_RIDE_BOOKING.customerLocation,
  customerPhone = DEMO_RIDE_BOOKING.customerPhone,
  serviceTitle = "Emergency Switchboard Fix & MCB Inspection",
  fareAmount = 350,
  apiBaseUrl,
  onSwitchToCustomerView,
  onSwitchToSplitView
}: WorkerConsoleProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const workerMarkerRef = useRef<any>(null);
  const customerMarkerRef = useRef<any>(null);
  const routeLineRef = useRef<any>(null);
  const simIntervalRef = useRef<any>(null);
  const watchIdRef = useRef<number | null>(null);

  const [isOnline, setIsOnline] = useState(true);
  const [currentStatus, setCurrentStatus] = useState<BookingStatus>(() => {
    const stored = getStoredRideState(bookingCode);
    return stored?.status || "ASSIGNED";
  });

  const [workerPos, setWorkerPos] = useState(() => {
    const stored = getStoredRideState(bookingCode);
    return stored?.workerLocation || DEMO_RIDE_BOOKING.workerLocation;
  });

  const [waypoints, setWaypoints] = useState<[number, number][]>([]);
  const [_currentWaypointIdx, setCurrentWaypointIdx] = useState(0);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simSpeed, setSimSpeed] = useState<number>(2); // 1x, 2x, 4x
  const [useDeviceGps, setUseDeviceGps] = useState(false);
  const [distanceRemaining, setDistanceRemaining] = useState<number>(2.1);
  const [etaRemaining, setEtaRemaining] = useState<number>(6);
  const [socketConnected, setSocketConnected] = useState(false);
  const [lastBroadcastTime, setLastBroadcastTime] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const socketRef = useRef<Socket | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Connect to Socket.IO
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

  // Broadcast location & status helper
  const broadcastLocationUpdate = useCallback(
    (lat: number, lng: number, heading: number, speed: number = 25) => {
      setLastBroadcastTime(new Date().toLocaleTimeString());

      // 1. Broadcast via Socket.IO
      if (socketRef.current?.connected) {
        socketRef.current.emit("worker:update_loc", {
          bookingId: bookingCode,
          workerId: DEMO_RIDE_BOOKING.worker.id,
          latitude: lat,
          longitude: lng,
          heading,
          speed,
          timestamp: new Date().toISOString()
        });
      }

      // 2. Broadcast via BroadcastChannel & LocalStorage (zero-latency cross-tab sync)
      broadcastRideState({
        bookingCode,
        status: currentStatus,
        workerLocation: { lat, lng, heading, speed },
        etaMinutes: etaRemaining,
        distanceKm: distanceRemaining
      });

      // 3. HTTP API fallback in background
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
    [bookingCode, currentStatus, etaRemaining, distanceRemaining]
  );

  // Broadcast status change helper
  const updateStatus = useCallback(
    async (newStatus: BookingStatus, note?: string) => {
      setCurrentStatus(newStatus);
      triggerToast(`Status updated: ${newStatus.replace(/_/g, " ")}`);

      // 1. Socket.IO
      if (socketRef.current?.connected) {
        socketRef.current.emit("worker:update_status", {
          bookingId: bookingCode,
          status: newStatus,
          workerName: DEMO_RIDE_BOOKING.worker.name,
          note
        });
      }

      // 2. BroadcastChannel & LocalStorage
      broadcastRideState({
        bookingCode,
        status: newStatus,
        workerLocation: workerPos,
        etaMinutes: newStatus === "COMPLETED" ? 0 : etaRemaining,
        distanceKm: newStatus === "COMPLETED" ? 0 : distanceRemaining
      });

      // 3. HTTP API fallback
      try {
        await createApiClient().updatePartnerBookingStatus(bookingCode, {
          status: newStatus,
          workerName: DEMO_RIDE_BOOKING.worker.name,
          note
        }).catch(() => null);
      } catch {
        // ignore
      }
    },
    [bookingCode, workerPos, etaRemaining, distanceRemaining]
  );

  // Fetch OSRM Road Route to get real street waypoints
  useEffect(() => {
    async function fetchRoute() {
      try {
        const wLat = DEMO_RIDE_BOOKING.workerLocation.lat;
        const wLng = DEMO_RIDE_BOOKING.workerLocation.lng;
        const cLat = customerLocation.lat;
        const cLng = customerLocation.lng;

        const url = `https://router.project-osrm.org/route/v1/driving/${wLng},${wLat};${cLng},${cLat}?overview=full&geometries=geojson`;
        const res = await fetch(url);
        const data = await res.json();

        if (data.routes && data.routes[0]) {
          const coords = data.routes[0].geometry.coordinates.map((c: [number, number]) => [c[1], c[0]] as [number, number]);
          setWaypoints(coords);
          const dist = +(data.routes[0].distance / 1000).toFixed(1);
          const mins = Math.max(1, Math.ceil(data.routes[0].duration / 60));
          setDistanceRemaining(dist);
          setEtaRemaining(mins);
        }
      } catch {
        // Fallback: 10 straight points between worker and customer
        const points: [number, number][] = [];
        const start = DEMO_RIDE_BOOKING.workerLocation;
        const end = customerLocation;
        for (let i = 0; i <= 10; i++) {
          const lat = start.lat + ((end.lat - start.lat) * i) / 10;
          const lng = start.lng + ((end.lng - start.lng) * i) / 10;
          points.push([lat, lng]);
        }
        setWaypoints(points);
      }
    }
    void fetchRoute();
  }, [customerLocation]);

  // Initialize Worker Navigation Map
  useEffect(() => {
    let isMounted = true;

    async function initMap() {
      if (typeof window === "undefined" || !mapContainerRef.current || mapInstanceRef.current) return;
      const L = await import("leaflet");
      if (!isMounted || !mapContainerRef.current) return;

      const map = L.map(mapContainerRef.current, {
        center: [workerPos.lat, workerPos.lng],
        zoom: 15,
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

      const cMarker = L.marker([customerLocation.lat, customerLocation.lng], { icon: customerIcon })
        .addTo(map)
        .bindPopup(`<b>${customerName}</b><br/>${customerAddress}`);
      customerMarkerRef.current = cMarker;

      // Worker Vehicle Pin
      const workerIcon = L.divIcon({
        className: "worker-driver-icon",
        html: `
          <div style="position:relative;display:flex;align-items:center;justify-content:center;width:48px;height:48px;">
            <div style="position:absolute;inset:-4px;border-radius:50%;background:#10b981;opacity:0.3;animation:pulse 2s infinite;"></div>
            <div style="display:flex;align-items:center;justify-content:center;width:42px;height:42px;border-radius:50%;background:#059669;color:white;box-shadow:0 4px 18px rgba(5,150,105,0.6);border:3px solid white;transform:rotate(${workerPos.heading || 0}deg);transition:transform 0.25s ease-out;z-index:2;">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="12 2 19 21 12 17 5 21 12 2"></polygon>
              </svg>
            </div>
            <div style="position:absolute;bottom:-20px;left:50%;transform:translateX(-50%);background:#065f46;color:#fff;font-size:10px;font-weight:700;padding:2px 7px;border-radius:99px;white-space:nowrap;box-shadow:0 2px 6px rgba(0,0,0,0.3);z-index:3;">
              You (Driver)
            </div>
          </div>
        `,
        iconSize: [48, 48],
        iconAnchor: [24, 24]
      });

      const wMarker = L.marker([workerPos.lat, workerPos.lng], { icon: workerIcon }).addTo(map);
      workerMarkerRef.current = wMarker;
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

  // Update Route Polyline when waypoints are loaded
  useEffect(() => {
    if (!mapInstanceRef.current || waypoints.length === 0) return;
    async function drawRoute() {
      const L = await import("leaflet");
      if (routeLineRef.current) {
        routeLineRef.current.setLatLngs(waypoints);
      } else {
        routeLineRef.current = L.polyline(waypoints, {
          color: "#059669",
          weight: 6,
          opacity: 0.85,
          dashArray: "6, 8"
        }).addTo(mapInstanceRef.current);
      }

      const bounds = L.latLngBounds([
        [workerPos.lat, workerPos.lng],
        [customerLocation.lat, customerLocation.lng]
      ]);
      mapInstanceRef.current.fitBounds(bounds, { padding: [60, 60] });
    }
    void drawRoute();
  }, [waypoints, customerLocation]);

  // Update Leaflet Worker Marker
  const moveMapWorkerMarker = async (lat: number, lng: number, heading: number) => {
    if (!workerMarkerRef.current) return;
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
            You (Driver)
          </div>
        </div>
      `,
      iconSize: [48, 48],
      iconAnchor: [24, 24]
    });

    workerMarkerRef.current.setLatLng([lat, lng]);
    workerMarkerRef.current.setIcon(workerIcon);

    // Pan map to follow worker
    if (mapInstanceRef.current) {
      mapInstanceRef.current.panTo([lat, lng], { animate: true, duration: 0.5 });
    }
  };

  // Auto-Drive Simulator along Road Waypoints
  useEffect(() => {
    if (!isSimulating || waypoints.length === 0) {
      if (simIntervalRef.current) clearInterval(simIntervalRef.current);
      return;
    }

    const intervalTime = Math.max(300, Math.floor(1000 / simSpeed));

    simIntervalRef.current = setInterval(() => {
      setCurrentWaypointIdx((prevIdx) => {
        const nextIdx = prevIdx + 1;
        if (nextIdx >= waypoints.length) {
          setIsSimulating(false);
          clearInterval(simIntervalRef.current);
          const finalPoint = waypoints[waypoints.length - 1];
          if (finalPoint) {
            setWorkerPos({ lat: finalPoint[0], lng: finalPoint[1], heading: 0, speed: 0 });
            void moveMapWorkerMarker(finalPoint[0], finalPoint[1], 0);
            broadcastLocationUpdate(finalPoint[0], finalPoint[1], 0, 0);
          }
          setDistanceRemaining(0);
          setEtaRemaining(0);
          triggerToast("You have arrived at the customer doorstep!");
          return prevIdx;
        }

        const curr = waypoints[prevIdx];
        const next = waypoints[nextIdx];

        if (curr && next) {
          const heading = Math.round(calculateBearing(curr[0], curr[1], next[0], next[1]));
          const newPos = { lat: next[0], lng: next[1], heading, speed: 32 };
          setWorkerPos(newPos);
          void moveMapWorkerMarker(next[0], next[1], heading);
          broadcastLocationUpdate(next[0], next[1], heading, 32);

          // Update distance remaining
          const remainingDist = calculateDistanceKm(next[0], next[1], customerLocation.lat, customerLocation.lng);
          setDistanceRemaining(remainingDist);
          setEtaRemaining(Math.max(1, Math.round(remainingDist * 2.5)));
        }

        return nextIdx;
      });
    }, intervalTime);

    return () => {
      if (simIntervalRef.current) clearInterval(simIntervalRef.current);
    };
  }, [isSimulating, simSpeed, waypoints, customerLocation, broadcastLocationUpdate]);

  // Real GPS Device Tracking
  const toggleDeviceGps = () => {
    if (useDeviceGps) {
      if (watchIdRef.current !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      setUseDeviceGps(false);
      triggerToast("Real GPS broadcast paused");
    } else {
      if (!navigator.geolocation) {
        alert("Geolocation is not supported by your browser");
        return;
      }
      setUseDeviceGps(true);
      triggerToast("Broadcasting real GPS position from this device");

      watchIdRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          const heading = pos.coords.heading || 0;
          const speed = pos.coords.speed ? +(pos.coords.speed * 3.6).toFixed(1) : 20;

          const newPos = { lat, lng, heading, speed };
          setWorkerPos(newPos);
          void moveMapWorkerMarker(lat, lng, heading);
          broadcastLocationUpdate(lat, lng, heading, speed);

          const rem = calculateDistanceKm(lat, lng, customerLocation.lat, customerLocation.lng);
          setDistanceRemaining(rem);
          setEtaRemaining(Math.max(1, Math.round(rem * 3)));
        },
        (err) => {
          console.warn("GPS error", err);
          triggerToast("GPS access denied or unavailable");
          setUseDeviceGps(false);
        },
        { enableHighAccuracy: true, maximumAge: 3000 }
      );
    }
  };

  const startTrip = () => {
    updateStatus("EN_ROUTE", "Technician started trip to customer");
    setIsSimulating(true);
    triggerToast("Trip started! Customer now tracks your car/bike in real-time.");
  };

  const markArrived = () => {
    setIsSimulating(false);
    updateStatus("IN_PROGRESS", "Partner arrived at doorstep and starting service");
    triggerToast("Arrived at customer doorstep! Ringing customer bell.");
  };

  const markCompleted = () => {
    setIsSimulating(false);
    updateStatus("COMPLETED", "Service successfully completed & paid");
    triggerToast("Job Completed! ₹" + fareAmount + " added to your wallet.");
  };

  const resetTripDemo = () => {
    setIsSimulating(false);
    setCurrentWaypointIdx(0);
    const start = DEMO_RIDE_BOOKING.workerLocation;
    setWorkerPos(start);
    setCurrentStatus("ASSIGNED");
    setDistanceRemaining(2.1);
    setEtaRemaining(6);
    void moveMapWorkerMarker(start.lat, start.lng, start.heading);
    broadcastLocationUpdate(start.lat, start.lng, start.heading, 0);
    broadcastRideState({
      bookingCode,
      status: "ASSIGNED",
      workerLocation: start,
      etaMinutes: 6,
      distanceKm: 2.1
    });
    triggerToast("Ride demo reset to start position.");
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

      {/* Top Driver Bar: Profile & Availability Status */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-neutral-200/90 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-14 h-14 rounded-2xl bg-neutral-900 text-white flex items-center justify-center font-black text-xl shadow-lg shadow-neutral-900/15">
              B
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
                {DEMO_RIDE_BOOKING.worker.name}
              </h2>
              <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[11px] font-bold rounded-md border border-emerald-200">
                Verified Pro
              </span>
            </div>
            <p className="text-xs text-neutral-500 font-medium">
              {DEMO_RIDE_BOOKING.worker.trade} • Guwahati Zone
            </p>
          </div>
        </div>

        {/* Action Controls & Role Switcher */}
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
            <span>{isOnline ? "Online (Receiving Jobs)" : "Offline"}</span>
          </button>

          {/* Switch to Customer View */}
          {onSwitchToCustomerView && (
            <button
              type="button"
              onClick={onSwitchToCustomerView}
              className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-2xl text-xs font-bold transition flex items-center gap-1.5"
            >
              <span>👤 Customer Screen</span>
            </button>
          )}

          {/* Split Screen Button */}
          {onSwitchToSplitView && (
            <button
              type="button"
              onClick={onSwitchToSplitView}
              className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-2xl text-xs font-bold transition flex items-center gap-1.5 shadow"
            >
              <span>📱 Side-by-Side View</span>
            </button>
          )}
        </div>
      </div>

      {/* Active Trip Banner (Car-Booking Cockpit) */}
      <div className="bg-gradient-to-r from-neutral-900 via-neutral-800 to-neutral-950 text-white rounded-3xl p-5 sm:p-6 shadow-xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-neutral-800">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[11px] font-bold">
                ACTIVE DISPATCH
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
            <span className="text-[10px] text-neutral-400">Cash on Service</span>
          </div>
        </div>

        {/* Customer Details & Quick Contact */}
        <div className="pt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-neutral-800 text-sky-400 flex items-center justify-center font-bold">
              👤
            </div>
            <div>
              <span className="font-bold text-white text-sm">{customerName}</span>
              <p className="text-neutral-400">{customerPhone}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <a
              href={`tel:${customerPhone}`}
              className="flex-1 sm:flex-initial px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl font-bold transition flex items-center justify-center gap-1.5 text-xs"
            >
              📞 Call Customer
            </a>
            <a
              href={`https://wa.me/91${customerPhone.replace(/\D/g, "")}?text=${encodeURIComponent(
                `Hello ${customerName}, I am Biswajit from Marac Workers. I am heading to your location for ${serviceTitle}.`
              )}`}
              target="_blank"
              rel="noreferrer"
              className="flex-1 sm:flex-initial px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold transition flex items-center justify-center gap-1.5 text-xs"
            >
              💬 WhatsApp
            </a>
          </div>
        </div>
      </div>

      {/* Driver Step Controls (Uber Driver Style) */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-neutral-200/90 shadow-sm">
        <p className="text-xs uppercase font-black tracking-wider text-neutral-400 mb-3">
          Driver Action Flow • Turn-by-Turn Execution
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Step 1: Start Trip */}
          <button
            type="button"
            onClick={startTrip}
            disabled={currentStatus === "EN_ROUTE" || currentStatus === "IN_PROGRESS" || currentStatus === "COMPLETED"}
            className={`p-4 rounded-2xl font-bold text-xs transition flex flex-col items-center justify-center text-center gap-2 ${
              currentStatus === "ASSIGNED" || currentStatus === "CONFIRMED"
                ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/30 ring-4 ring-emerald-500/20 scale-[1.02]"
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
            onClick={markArrived}
            disabled={currentStatus !== "EN_ROUTE"}
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
              <span className="block text-sm font-black">2. I Have Arrived</span>
              <span className="text-[10px] opacity-80">At Customer Door</span>
            </div>
          </button>

          {/* Step 3: Start Service */}
          <button
            type="button"
            onClick={() => updateStatus("IN_PROGRESS", "Partner started service execution")}
            disabled={currentStatus !== "IN_PROGRESS"}
            className={`p-4 rounded-2xl font-bold text-xs transition flex flex-col items-center justify-center text-center gap-2 ${
              currentStatus === "IN_PROGRESS"
                ? "bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-600/30 ring-4 ring-purple-500/20"
                : currentStatus === "COMPLETED"
                ? "bg-purple-50 text-purple-800 border border-purple-300"
                : "bg-neutral-100 text-neutral-400 cursor-not-allowed"
            }`}
          >
            <span className="text-xl">⚡</span>
            <div>
              <span className="block text-sm font-black">3. Service In Progress</span>
              <span className="text-[10px] opacity-80">Work under execution</span>
            </div>
          </button>

          {/* Step 4: Complete Job */}
          <button
            type="button"
            onClick={markCompleted}
            disabled={currentStatus !== "IN_PROGRESS"}
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
              <span className="block text-sm font-black">4. Complete Job</span>
              <span className="text-[10px] opacity-80">Collect ₹{fareAmount}</span>
            </div>
          </button>
        </div>

        {/* Simulator & GPS Control Bar */}
        <div className="mt-4 pt-4 border-t border-neutral-100 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <span className="font-bold text-neutral-700">Route Simulator:</span>

            {/* Play/Pause */}
            <button
              type="button"
              onClick={() => {
                const next = !isSimulating;
                setIsSimulating(next);
                if (next && currentStatus === "ASSIGNED") {
                  setCurrentStatus("EN_ROUTE");
                }
              }}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 ${
                isSimulating
                  ? "bg-amber-100 text-amber-800 hover:bg-amber-200"
                  : "bg-emerald-600 text-white hover:bg-emerald-700"
              }`}
            >
              {isSimulating ? "⏸ Pause Drive" : "▶ Start Drive Sim"}
            </button>

            {/* Speed Multiplier */}
            <div className="flex items-center gap-1 bg-neutral-100 p-1 rounded-xl">
              {[1, 2, 4].map((spd) => (
                <button
                  key={spd}
                  type="button"
                  onClick={() => setSimSpeed(spd)}
                  className={`px-2 py-0.5 rounded-lg text-[11px] font-bold ${
                    simSpeed === spd ? "bg-white text-neutral-900 shadow-sm" : "text-neutral-500"
                  }`}
                >
                  {spd}x
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={resetTripDemo}
              className="px-3 py-1.5 text-neutral-500 hover:text-neutral-900 font-semibold text-xs"
            >
              Reset Route
            </button>
          </div>

          {/* Real Device GPS Toggle */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleDeviceGps}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border ${
                useDeviceGps
                  ? "bg-blue-50 text-blue-700 border-blue-300 animate-pulse"
                  : "bg-neutral-100 text-neutral-600 border-neutral-200"
              }`}
            >
              <span>🛰️</span>
              <span>{useDeviceGps ? "Using Real Phone GPS" : "Use Real Device GPS"}</span>
            </button>

            {lastBroadcastTime && (
              <span className="text-[10px] text-neutral-400 hidden sm:inline">
                Synced: {lastBroadcastTime}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Driver Navigation Map */}
      <div className="relative w-full h-[450px] md:h-[500px] rounded-3xl overflow-hidden border border-neutral-200/90 shadow-xl bg-neutral-100">
        <div ref={mapContainerRef} className="w-full h-full z-0" />

        {/* Turn Guidance Top Banner (Uber Driver HUD) */}
        <div className="absolute top-4 left-4 right-4 z-[500] max-w-md mx-auto bg-neutral-900/95 backdrop-blur-md text-white p-3.5 rounded-2xl shadow-2xl border border-neutral-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-bold text-lg">
              ↑
            </div>
            <div>
              <p className="text-xs font-bold leading-tight">
                {currentStatus === "COMPLETED"
                  ? "Trip completed! Customer service finished."
                  : distanceRemaining === 0
                  ? "You have arrived at the customer doorstep"
                  : "Drive straight on RG Baruah / Zoo Road"}
              </p>
              <p className="text-[11px] text-neutral-400">
                Destination: {customerAddress.split(",")[0]}
              </p>
            </div>
          </div>

          <div className="text-right border-l border-neutral-700 pl-3">
            <span className="text-base font-black text-emerald-400 block leading-tight">
              {currentStatus === "COMPLETED" ? "Done" : `${distanceRemaining} km`}
            </span>
            <span className="text-[10px] text-neutral-400">
              {currentStatus === "COMPLETED" ? "Completed" : `${etaRemaining} mins`}
            </span>
          </div>
        </div>

        {/* Bottom Floating Status Bar */}
        <div className="absolute bottom-4 left-4 z-[500] bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-2xl shadow-lg border border-neutral-200 text-xs flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-bold">
            <span className={`w-2.5 h-2.5 rounded-full ${socketConnected ? "bg-emerald-500 animate-ping" : "bg-emerald-500"}`} />
            <span className="text-neutral-900">
              {isSimulating ? "Moving (32 km/h)" : "Live Telemetry"}
            </span>
          </div>
          <span className="text-neutral-400">•</span>
          <span className="text-neutral-600 font-mono text-[11px]">
            {workerPos.lat.toFixed(4)}, {workerPos.lng.toFixed(4)}
          </span>
        </div>
      </div>
    </div>
  );
}
