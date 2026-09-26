"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useState, FormEvent } from "react";
import { createApiClient, getDefaultApiUrl } from "@the-wings/api-client";
import type { Booking, BookingStatus } from "@the-wings/types";

// Dynamic import with ssr: false to prevent Leaflet window access on server
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

const DEFAULT_COORDS = { lat: 26.1445, lng: 91.7362 }; // Guwahati default

const STATUS_STEPS: { status: BookingStatus; label: string; desc: string }[] = [
  { status: "CONFIRMED", label: "Confirmed", desc: "Booking received" },
  { status: "ASSIGNED", label: "Partner Assigned", desc: "Technician assigned" },
  { status: "EN_ROUTE", label: "On the Way", desc: "Heading to your location" },
  { status: "IN_PROGRESS", label: "In Progress", desc: "Service under execution" },
  { status: "COMPLETED", label: "Completed", desc: "Work completed" }
];

export default function TrackingPage() {
  const [bookingCode, setBookingCode] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Read ?code= from URL safely on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const code = new URLSearchParams(window.location.search).get("code") || "";
      if (code) {
        setBookingCode(code);
        setSearchInput(code);
      }
    }
  }, []);

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
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to load booking tracking details");
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

  const customerLat = Number(booking?.latitude) || DEFAULT_COORDS.lat;
  const customerLng = Number(booking?.longitude) || DEFAULT_COORDS.lng;
  const apiUrl = getDefaultApiUrl();

  return (
    <div className="min-h-screen bg-neutral-50/70 pb-20">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-neutral-200/80 px-4 sm:px-8 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="p-2 -ml-2 rounded-xl text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 transition"
              title="Back"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-neutral-900">Live Service Tracker</h1>
                {booking && (
                  <span className="px-2.5 py-0.5 bg-neutral-100 text-neutral-700 text-xs font-semibold rounded-md font-mono">
                    {booking.bookingCode}
                  </span>
                )}
              </div>
              {booking && (
                <p className="text-xs text-neutral-500">{booking.addressLine}, {booking.city}</p>
              )}
            </div>
          </div>

          <a
            href="tel:9365123456"
            className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-semibold transition"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>
            Support Helpline
          </a>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-8 pt-6 space-y-6">
        {/* Search Bar for entering or changing booking code */}
        <div className="bg-white rounded-3xl p-4 sm:p-6 border border-neutral-200/80 shadow-sm">
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Enter Booking Code (e.g. MW-260926-ABCD)"
              className="flex-1 px-4 py-3 rounded-2xl bg-neutral-100 border border-transparent focus:border-neutral-400 focus:bg-white text-sm outline-none transition font-mono uppercase"
            />
            <button
              type="submit"
              className="px-6 py-3 bg-neutral-900 text-white font-semibold rounded-2xl text-sm hover:bg-neutral-800 transition"
            >
              Track Booking
            </button>
          </form>
        </div>

        {loading && (
          <div className="bg-white rounded-3xl p-12 border border-neutral-200 flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-neutral-600 font-semibold text-sm">Connecting to live tracking...</p>
          </div>
        )}

        {error && !loading && (
          <div className="bg-white p-8 rounded-3xl border border-neutral-200 shadow-sm text-center">
            <div className="w-12 h-12 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-3 text-xl font-bold">
              !
            </div>
            <h2 className="text-lg font-bold text-neutral-900 mb-1">Tracking Info Unavailable</h2>
            <p className="text-neutral-500 text-sm">{error}</p>
          </div>
        )}

        {!booking && !loading && !error && (
          <div className="bg-white p-12 rounded-3xl border border-neutral-200 shadow-sm text-center">
            <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3 text-2xl">
              📍
            </div>
            <h2 className="text-lg font-bold text-neutral-900 mb-1">Realtime Technician Dispatch Tracking</h2>
            <p className="text-neutral-500 text-sm max-w-md mx-auto">
              Enter your booking code above to watch your assigned professional move towards your location in real time.
            </p>
          </div>
        )}

        {booking && (
          <>
            {/* Progress Milestone Bar */}
            <div className="bg-white rounded-3xl p-6 border border-neutral-200/80 shadow-sm">
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                {STATUS_STEPS.map((step, idx) => {
                  const state = getStepState(step.status, booking.status);
                  return (
                    <div key={step.status} className="flex flex-col items-center text-center relative">
                      <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs mb-2 transition-all ${
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
                        className={`text-xs font-bold leading-tight ${
                          state === "completed" || state === "current" ? "text-neutral-900" : "text-neutral-400"
                        }`}
                      >
                        {step.label}
                      </p>
                      <p className="text-[11px] text-neutral-400 mt-0.5 hidden sm:block">{step.desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Live Interactive Map */}
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

            {/* Booking Details Card */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white rounded-3xl p-6 border border-neutral-200/80 shadow-sm">
                <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-400 mb-4">Booked Services</h2>
                <div className="space-y-3">
                  {booking.items && booking.items.length > 0 ? (
                    booking.items.map((item, i) => (
                      <div key={i} className="flex items-center justify-between py-2 border-b border-neutral-100 last:border-0">
                        <div>
                          <p className="text-sm font-semibold text-neutral-900">{item.serviceName}</p>
                          <p className="text-xs text-neutral-500">Qty: {item.quantity}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-neutral-500">Service booking details</p>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-3xl p-6 border border-neutral-200/80 shadow-sm flex flex-col justify-between">
                <div>
                  <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-400 mb-4">Service Schedule</h2>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 text-neutral-700">
                      <span className="text-sm font-medium">Slot:</span>
                      <span className="text-sm font-bold text-neutral-900">{booking.preferredTimeSlot}</span>
                    </div>
                    <div className="flex items-center gap-3 text-neutral-700">
                      <span className="text-sm font-medium">Destination:</span>
                      <span className="text-sm text-neutral-600">{booking.addressLine}, {booking.city}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-neutral-100 flex items-center justify-between">
                  <span className="text-xs text-neutral-400">Need assistance?</span>
                  <a
                    href={`https://wa.me/919365123456?text=${encodeURIComponent(
                      `Hi, I have a question regarding my booking ${booking.bookingCode}`
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 hover:text-emerald-700"
                  >
                    <span>Chat on WhatsApp</span>
                    <span aria-hidden="true">→</span>
                  </a>
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
