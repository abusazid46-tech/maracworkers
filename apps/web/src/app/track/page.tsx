"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useState, FormEvent } from "react";
import { createApiClient, getDefaultApiUrl } from "@the-wings/api-client";
import type { Booking, BookingStatus } from "@the-wings/types";
import {
  setLastActiveBookingCode,
  getLastActiveBookingCode,
  GUWAHATI_DEFAULT_COORDS
} from "@/lib/trackingSync";

// Dynamic imports with ssr: false for Leaflet maps
const TrackingMap = dynamic(() => import("@/components/TrackingMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[450px] md:h-[500px] rounded-3xl bg-neutral-100 flex items-center justify-center animate-pulse border border-neutral-200">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-neutral-500 font-medium">Connecting to live map &amp; GPS satellite network...</p>
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
        <p className="text-sm text-neutral-500 font-medium">Initializing partner navigation console...</p>
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
  const [viewMode, setViewMode] = useState<"customer" | "worker">("customer");
  const [bookingCode, setBookingCode] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [booking, setBooking] = useState<Booking | null>(null);
  const [recentBookings, setRecentBookings] = useState<Array<{ bookingCode: string; serviceSummary: string; status: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Read URL params or past customer bookings on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code") || "";
      const mode = params.get("mode");

      if (mode === "worker") {
        setViewMode("worker");
      }

      // Check customer local booking history
      try {
        const storedHistory = window.localStorage.getItem("marac_customer_bookings");
        if (storedHistory) {
          const parsed = JSON.parse(storedHistory);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setRecentBookings(parsed.slice(0, 4));
          }
        }
      } catch {
        // ignore
      }

      if (code) {
        setBookingCode(code);
        setSearchInput(code);
      } else {
        const lastCode = getLastActiveBookingCode();
        if (lastCode) {
          setBookingCode(lastCode);
          setSearchInput(lastCode);
        }
      }
    }
  }, []);

  // Fetch real booking tracking from backend API
  useEffect(() => {
    if (!bookingCode) {
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
        setError(err instanceof Error ? err.message : "Booking code not found. Please verify your reference number.");
        setBooking(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [bookingCode]);

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      setBookingCode(searchInput.trim());
      if (typeof window !== "undefined") {
        const newUrl = `${window.location.pathname}?code=${encodeURIComponent(searchInput.trim())}`;
        window.history.replaceState(null, "", newUrl);
      }
    }
  };

  const handleSelectRecent = (code: string) => {
    setSearchInput(code);
    setBookingCode(code);
    if (typeof window !== "undefined") {
      const newUrl = `${window.location.pathname}?code=${encodeURIComponent(code)}`;
      window.history.replaceState(null, "", newUrl);
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

  const customerLat = Number(booking?.latitude) || GUWAHATI_DEFAULT_COORDS.lat;
  const customerLng = Number(booking?.longitude) || GUWAHATI_DEFAULT_COORDS.lng;
  const apiUrl = getDefaultApiUrl();

  return (
    <div className="min-h-screen bg-neutral-50/70 pb-20">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-neutral-200/80 px-4 sm:px-8 py-3.5">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
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
                  Live Service Dispatch Tracker
                </h1>
                {booking && (
                  <span className="px-2.5 py-0.5 bg-neutral-100 text-neutral-800 text-xs font-mono font-bold rounded-md border border-neutral-200">
                    {booking.bookingCode}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-neutral-400 font-medium">
                Mutual Realtime GPS Tracking on Marac Workers Web
              </p>
            </div>
          </div>

          {/* Role Switcher */}
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
              <span>Customer View</span>
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
              <span>Partner Console</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-8 pt-6 space-y-6">
        {/* Booking Code Search Bar */}
        <div className="bg-white rounded-3xl p-4 sm:p-6 border border-neutral-200/80 shadow-sm">
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Enter Booking Code (e.g. MW-260926-XXXX)"
              className="flex-1 px-4 py-3 rounded-2xl bg-neutral-100 border border-transparent focus:border-neutral-400 focus:bg-white text-sm outline-none transition font-mono uppercase font-bold"
            />
            <button
              type="submit"
              className="px-6 py-3 bg-neutral-900 text-white font-bold rounded-2xl text-sm hover:bg-neutral-800 transition shadow"
            >
              Track Booking
            </button>
          </form>

          {/* Recent Bookings Quick Access */}
          {recentBookings.length > 0 && !booking && (
            <div className="mt-4 pt-4 border-t border-neutral-100">
              <p className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">
                Your Recent Orders
              </p>
              <div className="flex flex-wrap gap-2">
                {recentBookings.map((item) => (
                  <button
                    key={item.bookingCode}
                    type="button"
                    onClick={() => handleSelectRecent(item.bookingCode)}
                    className="px-3.5 py-1.5 bg-neutral-50 hover:bg-neutral-100 text-neutral-800 rounded-xl text-xs font-medium border border-neutral-200 transition flex items-center gap-2"
                  >
                    <span className="font-mono font-bold text-neutral-900">{item.bookingCode}</span>
                    <span className="text-neutral-400">•</span>
                    <span className="truncate max-w-[150px]">{item.serviceSummary}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {loading && (
          <div className="bg-white rounded-3xl p-12 border border-neutral-200 flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-neutral-600 font-semibold text-sm">Connecting to live tracking database...</p>
          </div>
        )}

        {error && !loading && (
          <div className="bg-white p-8 rounded-3xl border border-neutral-200 shadow-sm text-center">
            <div className="w-12 h-12 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-3 text-xl font-bold">
              !
            </div>
            <h2 className="text-lg font-bold text-neutral-900 mb-1">Booking Not Found</h2>
            <p className="text-neutral-500 text-sm max-w-md mx-auto">{error}</p>
          </div>
        )}

        {!booking && !loading && !error && (
          <div className="bg-white p-12 rounded-3xl border border-neutral-200 shadow-sm text-center">
            <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3 text-2xl">
              📍
            </div>
            <h2 className="text-lg font-bold text-neutral-900 mb-1">Realtime Service Dispatch &amp; GPS Tracking</h2>
            <p className="text-neutral-500 text-sm max-w-md mx-auto">
              Enter your booking code above to watch your assigned professional move towards your location in real time.
            </p>
          </div>
        )}

        {booking && (
          <>
            {/* VIEW 1: CUSTOMER VIEW */}
            {viewMode === "customer" && (
              <div className="space-y-6">
                {/* Progress Step Bar */}
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

                {/* Real Production Map */}
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

                {/* Booking Details Card */}
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
                            {item.unitPrice ? (
                              <span className="text-sm font-black text-neutral-900">₹{item.unitPrice}</span>
                            ) : null}
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
                        Service Destination &amp; Schedule
                      </h2>
                      <div className="space-y-2 text-xs">
                        <div className="flex items-center gap-2 text-neutral-700">
                          <span className="font-bold">Scheduled Slot:</span>
                          <span className="text-neutral-900">{booking.preferredTimeSlot}</span>
                        </div>
                        <div className="flex items-center gap-2 text-neutral-700">
                          <span className="font-bold">Address:</span>
                          <span className="text-neutral-600">{booking.addressLine}, {booking.city}</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-neutral-100 flex items-center justify-between">
                      <span className="text-xs text-neutral-400">Need support?</span>
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

            {/* VIEW 2: WORKER PARTNER CONSOLE */}
            {viewMode === "worker" && (
              <WorkerConsole
                bookingCode={booking.bookingCode}
                customerName={booking.customerName}
                customerAddress={booking.addressLine}
                customerLocation={{ lat: customerLat, lng: customerLng }}
                customerPhone={booking.customerPhone}
                serviceTitle={booking.items?.[0]?.serviceName || "Service Dispatch"}
                fareAmount={booking.totalAmount || 350}
                initialStatus={booking.status}
                apiBaseUrl={apiUrl}
                onSwitchToCustomerView={() => setViewMode("customer")}
              />
            )}
          </>
        )}
      </main>
    </div>
  );
}
