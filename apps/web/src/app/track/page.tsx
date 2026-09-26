"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useState, FormEvent } from "react";
import { createApiClient, getDefaultApiUrl } from "@the-wings/api-client";
import type { Booking, BookingStatus } from "@the-wings/types";
import { DEMO_RIDE_BOOKING, setLastActiveBookingCode, getLastActiveBookingCode } from "@/lib/trackingSync";

// Dynamic imports with ssr: false for Leaflet maps
const TrackingMap = dynamic(() => import("@/components/TrackingMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[450px] md:h-[500px] rounded-3xl bg-neutral-100 flex items-center justify-center animate-pulse border border-neutral-200">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-neutral-500 font-medium">Loading live map & satellite tiles...</p>
      </div>
    </div>
  )
});

const WorkerConsole = dynamic(() => import("@/components/WorkerConsole"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[450px] md:h-[500px] rounded-3xl bg-neutral-100 flex items-center justify-center animate-pulse border border-neutral-200">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-neutral-500 font-medium">Loading partner console...</p>
      </div>
    </div>
  )
});

const STATUS_STEPS: { status: BookingStatus; label: string; desc: string }[] = [
  { status: "CONFIRMED", label: "Confirmed", desc: "Booking received" },
  { status: "ASSIGNED", label: "Partner Assigned", desc: "Technician assigned" },
  { status: "EN_ROUTE", label: "On the Way", desc: "Heading to location" },
  { status: "IN_PROGRESS", label: "In Progress", desc: "Work under execution" },
  { status: "COMPLETED", label: "Completed", desc: "Service completed" }
];

export default function TrackingPage() {
  const [viewMode, setViewMode] = useState<"customer" | "worker" | "split">("customer");
  const [bookingCode, setBookingCode] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(false);

  // Read URL params or past storage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code") || "";
      const mode = params.get("mode");

      if (mode === "worker" || mode === "split") {
        setViewMode(mode);
      }

      if (code) {
        setBookingCode(code);
        setSearchInput(code);
      } else {
        const lastCode = getLastActiveBookingCode();
        if (lastCode) {
          setBookingCode(lastCode);
          setSearchInput(lastCode);
        } else {
          // Default to interactive demo ride so user immediately sees the map
          loadDemoRide();
        }
      }
    }
  }, []);

  const loadDemoRide = () => {
    setIsDemoMode(true);
    setBookingCode(DEMO_RIDE_BOOKING.bookingCode);
    setSearchInput(DEMO_RIDE_BOOKING.bookingCode);
    setLastActiveBookingCode(DEMO_RIDE_BOOKING.bookingCode);
    setBooking({
      id: "demo-booking-id",
      bookingCode: DEMO_RIDE_BOOKING.bookingCode,
      customerName: DEMO_RIDE_BOOKING.customerName,
      customerPhone: DEMO_RIDE_BOOKING.customerPhone,
      addressLine: DEMO_RIDE_BOOKING.customerAddress,
      city: "Guwahati",
      latitude: DEMO_RIDE_BOOKING.customerLocation.lat,
      longitude: DEMO_RIDE_BOOKING.customerLocation.lng,
      status: DEMO_RIDE_BOOKING.status,
      preferredDate: "Today",
      preferredTimeSlot: "Immediate Express Dispatch",
      paymentMode: "COD",
      paymentStatus: "PENDING",
      totalAmount: 350,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      items: [
        {
          id: "item-1",
          bookingId: "demo-booking-id",
          serviceName: "Emergency Switchboard Fix & MCB Inspection",
          quantity: 1,
          unitPrice: 350
        }
      ],
      assignedStaff: {
        id: DEMO_RIDE_BOOKING.worker.id,
        name: DEMO_RIDE_BOOKING.worker.name,
        phone: DEMO_RIDE_BOOKING.worker.phone,
        role: DEMO_RIDE_BOOKING.worker.trade,
        currentLat: DEMO_RIDE_BOOKING.workerLocation.lat,
        currentLng: DEMO_RIDE_BOOKING.workerLocation.lng,
        lastHeading: DEMO_RIDE_BOOKING.workerLocation.heading
      }
    } as any);
  };

  useEffect(() => {
    if (!bookingCode || isDemoMode) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const api = createApiClient();
    api
      .getBookingTracking(bookingCode.trim())
      .then((res) => {
        setBooking(res.data);
        setLastActiveBookingCode(res.data.bookingCode);
      })
      .catch((err) => {
        // If booking not found on remote server, fallback to demo ride
        console.warn("Could not fetch remote tracking, loading demo context", err);
        loadDemoRide();
      })
      .finally(() => {
        setLoading(false);
      });
  }, [bookingCode]);

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      setIsDemoMode(false);
      setBookingCode(searchInput.trim());
      if (typeof window !== "undefined") {
        const newUrl = `${window.location.pathname}?code=${encodeURIComponent(searchInput.trim())}`;
        window.history.replaceState(null, "", newUrl);
      }
    }
  };

  const handleStatusChange = (newStatus: BookingStatus) => {
    setBooking((prev) => (prev ? { ...prev, status: newStatus } : null));
  };

  const getStepState = (stepStatus: BookingStatus, currentStatus: BookingStatus) => {
    const order: BookingStatus[] = ["PENDING", "CONFIRMED", "ASSIGNED", "EN_ROUTE", "IN_PROGRESS", "COMPLETED"];
    const currentIndex = order.indexOf(currentStatus);
    const stepIndex = order.indexOf(stepStatus);

    if (currentIndex >= stepIndex) return "completed";
    if (currentIndex === stepIndex - 1) return "current";
    return "upcoming";
  };

  const customerLat = Number(booking?.latitude) || DEMO_RIDE_BOOKING.customerLocation.lat;
  const customerLng = Number(booking?.longitude) || DEMO_RIDE_BOOKING.customerLocation.lng;
  const apiUrl = getDefaultApiUrl();

  return (
    <div className="min-h-screen bg-neutral-50/70 pb-20">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-neutral-200/80 px-4 sm:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="p-2 -ml-2 rounded-xl text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 transition"
              title="Home"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
            </Link>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-black text-neutral-900 tracking-tight">
                  Marac Workers Live Dispatch
                </h1>
                {isDemoMode && (
                  <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-black rounded-md border border-emerald-200 uppercase">
                    Interactive Demo
                  </span>
                )}
              </div>
              <p className="text-[11px] text-neutral-400 font-medium">
                Mutual Car-Booking Realtime GPS Tracking
              </p>
            </div>
          </div>

          {/* Unified Platform Role Switcher */}
          <div className="flex items-center bg-neutral-100 p-1 rounded-2xl border border-neutral-200/70">
            <button
              type="button"
              onClick={() => setViewMode("customer")}
              className={`px-3 sm:px-4 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                viewMode === "customer"
                  ? "bg-white text-neutral-900 shadow-sm"
                  : "text-neutral-500 hover:text-neutral-900"
              }`}
            >
              <span>👤</span>
              <span className="hidden sm:inline">Customer View</span>
              <span className="sm:hidden">Customer</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode("worker")}
              className={`px-3 sm:px-4 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                viewMode === "worker"
                  ? "bg-neutral-900 text-white shadow-sm"
                  : "text-neutral-500 hover:text-neutral-900"
              }`}
            >
              <span>🦺</span>
              <span className="hidden sm:inline">Worker Console</span>
              <span className="sm:hidden">Worker</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode("split")}
              className={`hidden md:flex px-3 sm:px-4 py-1.5 rounded-xl text-xs font-bold transition items-center gap-1.5 ${
                viewMode === "split"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-neutral-500 hover:text-neutral-900"
              }`}
              title="Dual Screen: Customer & Worker tracking simultaneously"
            >
              <span>📱</span>
              <span>Side-by-Side</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-8 pt-5 space-y-5">
        {/* Booking Code Bar & Demo Launcher */}
        <div className="bg-white rounded-3xl p-4 sm:p-5 border border-neutral-200/80 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <form onSubmit={handleSearch} className="flex-1 flex gap-2">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Enter Booking Code (e.g. MW-DEMO-RIDE)"
              className="flex-1 px-4 py-2.5 rounded-2xl bg-neutral-100 border border-transparent focus:border-neutral-400 focus:bg-white text-xs sm:text-sm outline-none transition font-mono uppercase font-bold"
            />
            <button
              type="submit"
              className="px-5 py-2.5 bg-neutral-900 text-white font-bold rounded-2xl text-xs hover:bg-neutral-800 transition"
            >
              Track
            </button>
          </form>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={loadDemoRide}
              className="px-4 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold rounded-2xl text-xs border border-emerald-200 transition flex items-center gap-1.5"
            >
              <span>⚡</span>
              <span>Launch Live Ride Demo</span>
            </button>
          </div>
        </div>

        {loading && (
          <div className="bg-white rounded-3xl p-12 border border-neutral-200 flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-neutral-600 font-semibold text-sm">Connecting to live tracking...</p>
          </div>
        )}

        {error && !loading && !booking && (
          <div className="bg-white p-8 rounded-3xl border border-neutral-200 shadow-sm text-center">
            <div className="w-12 h-12 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-3 text-xl font-bold">
              !
            </div>
            <h2 className="text-lg font-bold text-neutral-900 mb-1">Tracking Info Unavailable</h2>
            <p className="text-neutral-500 text-sm">{error}</p>
            <button
              type="button"
              onClick={loadDemoRide}
              className="mt-4 px-5 py-2.5 bg-emerald-600 text-white rounded-2xl text-xs font-bold"
            >
              Start Interactive Demo
            </button>
          </div>
        )}

        {booking && (
          <>
            {/* VIEW 1: CUSTOMER VIEW */}
            {viewMode === "customer" && (
              <div className="space-y-5">
                {/* Step Milestone Bar */}
                <div className="bg-white rounded-3xl p-5 sm:p-6 border border-neutral-200/80 shadow-sm">
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    {STATUS_STEPS.map((step, idx) => {
                      const state = getStepState(step.status, booking.status);
                      return (
                        <div key={step.status} className="flex flex-col items-center text-center relative">
                          <div
                            className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center font-bold text-xs mb-1.5 transition-all ${
                              state === "completed"
                                ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30"
                                : state === "current"
                                ? "bg-emerald-100 text-emerald-700 ring-4 ring-emerald-500/20 animate-pulse"
                                : "bg-neutral-100 text-neutral-400"
                            }`}
                          >
                            {state === "completed" ? "✓" : idx + 1}
                          </div>
                          <p
                            className={`text-[11px] sm:text-xs font-bold leading-tight ${
                              state === "completed" || state === "current" ? "text-neutral-900" : "text-neutral-400"
                            }`}
                          >
                            {step.label}
                          </p>
                          <p className="text-[10px] text-neutral-400 mt-0.5 hidden sm:block">{step.desc}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Customer Live Interactive Map */}
                <TrackingMap
                  bookingCode={booking.bookingCode}
                  customerName={booking.customerName}
                  customerAddress={booking.addressLine}
                  customerLocation={{ lat: customerLat, lng: customerLng }}
                  initialStatus={booking.status}
                  initialStaff={booking.assignedStaff}
                  apiBaseUrl={apiUrl}
                  onStatusChange={handleStatusChange}
                  onSwitchToWorkerMode={() => setViewMode("worker")}
                />

                {/* Booking Summary Card */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white rounded-3xl p-6 border border-neutral-200/80 shadow-sm">
                    <h2 className="text-xs font-black uppercase tracking-wider text-neutral-400 mb-3">
                      Booked Services
                    </h2>
                    <div className="space-y-3">
                      {booking.items && booking.items.length > 0 ? (
                        booking.items.map((item, i) => (
                          <div key={i} className="flex items-center justify-between py-2 border-b border-neutral-100 last:border-0">
                            <div>
                              <p className="text-sm font-bold text-neutral-900">{item.serviceName}</p>
                              <p className="text-xs text-neutral-500">Qty: {item.quantity}</p>
                            </div>
                            <span className="text-sm font-black text-neutral-900">₹{item.unitPrice}</span>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-neutral-500">Service booking details</p>
                      )}
                    </div>
                  </div>

                  <div className="bg-white rounded-3xl p-6 border border-neutral-200/80 shadow-sm flex flex-col justify-between">
                    <div>
                      <h2 className="text-xs font-black uppercase tracking-wider text-neutral-400 mb-3">
                        Service Destination & Dispatch
                      </h2>
                      <div className="space-y-2 text-xs">
                        <div className="flex items-center gap-2 text-neutral-700">
                          <span className="font-bold">Slot:</span>
                          <span className="text-neutral-900">{booking.preferredTimeSlot}</span>
                        </div>
                        <div className="flex items-center gap-2 text-neutral-700">
                          <span className="font-bold">Address:</span>
                          <span className="text-neutral-600">{booking.addressLine}, {booking.city}</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-neutral-100 flex items-center justify-between">
                      <span className="text-xs text-neutral-400">Need help?</span>
                      <a
                        href={`https://wa.me/919365123456?text=${encodeURIComponent(
                          `Hi, I have a question regarding my booking ${booking.bookingCode}`
                        )}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 hover:text-emerald-700"
                      >
                        <span>Chat on WhatsApp</span>
                        <span aria-hidden="true">→</span>
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* VIEW 2: WORKER DRIVER CONSOLE */}
            {viewMode === "worker" && (
              <WorkerConsole
                bookingCode={booking.bookingCode}
                customerName={booking.customerName}
                customerAddress={booking.addressLine}
                customerLocation={{ lat: customerLat, lng: customerLng }}
                customerPhone={booking.customerPhone}
                serviceTitle={booking.items?.[0]?.serviceName || "Electrical Service Inspection"}
                fareAmount={booking.totalAmount || 350}
                apiBaseUrl={apiUrl}
                onSwitchToCustomerView={() => setViewMode("customer")}
                onSwitchToSplitView={() => setViewMode("split")}
              />
            )}

            {/* VIEW 3: SPLIT SCREEN (SIDE-BY-SIDE DUAL VIEW) */}
            {viewMode === "split" && (
              <div className="space-y-4">
                <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-3xl flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-base">✨</span>
                    <div>
                      <span className="font-black text-emerald-950 block">
                        Dual Real-Time Car-Booking Experience
                      </span>
                      <span className="text-emerald-700">
                        Left: Customer watching live arrival. Right: Worker driving along the road.
                        Click &ldquo;1. Start Trip&rdquo; on the right to watch both screens sync!
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setViewMode("customer")}
                    className="px-3 py-1.5 bg-white text-emerald-800 font-bold rounded-xl shadow-sm border border-emerald-200"
                  >
                    Close Split
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                  {/* Left Column: Customer Screen */}
                  <div className="bg-neutral-100/70 p-4 rounded-3xl border border-neutral-200/90 shadow-sm flex flex-col gap-4">
                    <div className="flex items-center justify-between px-2">
                      <span className="text-xs font-black text-neutral-800 uppercase tracking-wider flex items-center gap-2">
                        <span>👤 Customer Screen</span>
                        <span className="px-2 py-0.5 rounded bg-sky-100 text-sky-800 text-[10px] font-bold">
                          Passenger View
                        </span>
                      </span>
                      <span className="text-[11px] text-neutral-500 font-mono">
                        #{booking.bookingCode}
                      </span>
                    </div>

                    <TrackingMap
                      bookingCode={booking.bookingCode}
                      customerName={booking.customerName}
                      customerAddress={booking.addressLine}
                      customerLocation={{ lat: customerLat, lng: customerLng }}
                      initialStatus={booking.status}
                      initialStaff={booking.assignedStaff}
                      apiBaseUrl={apiUrl}
                      onStatusChange={handleStatusChange}
                    />
                  </div>

                  {/* Right Column: Worker Console */}
                  <div className="bg-neutral-100/70 p-4 rounded-3xl border border-neutral-200/90 shadow-sm flex flex-col gap-4">
                    <div className="flex items-center justify-between px-2">
                      <span className="text-xs font-black text-neutral-800 uppercase tracking-wider flex items-center gap-2">
                        <span>🦺 Worker Driver Seat</span>
                        <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                          Driver View
                        </span>
                      </span>
                      <span className="text-[11px] text-emerald-600 font-bold">
                        Live Telemetry
                      </span>
                    </div>

                    <WorkerConsole
                      bookingCode={booking.bookingCode}
                      customerName={booking.customerName}
                      customerAddress={booking.addressLine}
                      customerLocation={{ lat: customerLat, lng: customerLng }}
                      customerPhone={booking.customerPhone}
                      serviceTitle={booking.items?.[0]?.serviceName || "Electrical Service Inspection"}
                      fareAmount={booking.totalAmount || 350}
                      apiBaseUrl={apiUrl}
                    />
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
