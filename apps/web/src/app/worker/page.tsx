"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useState, FormEvent } from "react";
import { createApiClient, getDefaultApiUrl } from "@the-wings/api-client";
import type { Booking } from "@the-wings/types";
import { getLastActiveBookingCode, setLastActiveBookingCode, GUWAHATI_DEFAULT_COORDS } from "@/lib/trackingSync";

const WorkerConsole = dynamic(() => import("@/components/WorkerConsole"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[500px] rounded-3xl bg-neutral-100 flex items-center justify-center animate-pulse border border-neutral-200">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-neutral-500 font-bold">Connecting to Partner GPS &amp; Dispatch Console...</p>
      </div>
    </div>
  )
});

export default function WorkerPage() {
  const [bookingCode, setBookingCode] = useState("");
  const [codeInput, setCodeInput] = useState("");
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const apiUrl = getDefaultApiUrl();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const code = new URLSearchParams(window.location.search).get("code") || getLastActiveBookingCode() || "";
      if (code) {
        setBookingCode(code);
        setCodeInput(code);
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

    createApiClient()
      .getBookingTracking(bookingCode.trim())
      .then((res) => {
        setBooking(res.data);
        setLastActiveBookingCode(res.data.bookingCode);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Booking code not found. Please verify with dispatch desk.");
        setBooking(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [bookingCode]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (codeInput.trim()) {
      setBookingCode(codeInput.trim());
      if (typeof window !== "undefined") {
        const newUrl = `${window.location.pathname}?code=${encodeURIComponent(codeInput.trim())}`;
        window.history.replaceState(null, "", newUrl);
      }
    }
  };

  const customerLat = Number(booking?.latitude) || GUWAHATI_DEFAULT_COORDS.lat;
  const customerLng = Number(booking?.longitude) || GUWAHATI_DEFAULT_COORDS.lng;

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
                  Marac Partner Console
                </h1>
                <span className="px-2 py-0.5 bg-emerald-600 text-white text-[10px] font-black rounded-md uppercase">
                  Driver Mode
                </span>
              </div>
              <p className="text-[11px] text-neutral-400 font-medium">
                Live Turn-by-Turn GPS Navigation &amp; Dispatch Duty
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/worker/register"
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
            >
              <span>✍️ Register as Worker</span>
            </Link>
            {bookingCode && (
              <Link
                href={`/track?code=${encodeURIComponent(bookingCode)}`}
                className="px-3.5 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
              >
                <span>👤 Customer Screen</span>
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-8 pt-6 space-y-6">
        {/* Onboarding Notice for New Workers */}
        <div className="bg-gradient-to-r from-sky-50 to-emerald-50 rounded-2xl p-4 border border-sky-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-neutral-900">New Tradesperson or Helper?</h2>
            <p className="text-xs text-neutral-600">Register your profile and trade documents to get verified and approved by Admin for daily bookings.</p>
          </div>
          <Link
            href="/worker/register"
            className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl whitespace-nowrap transition"
          >
            Apply for Verification →
          </Link>
        </div>

        {/* Booking Code Dispatch Input */}
        <div className="bg-white rounded-3xl p-4 sm:p-6 border border-neutral-200/80 shadow-sm">
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={codeInput}
              onChange={(e) => setCodeInput(e.target.value)}
              placeholder="Enter Assigned Booking Code (e.g. MW-260926-XXXX)"
              className="flex-1 px-4 py-3 rounded-2xl bg-neutral-100 border border-transparent focus:border-neutral-400 focus:bg-white text-sm outline-none transition font-mono uppercase font-bold"
            />
            <button
              type="submit"
              className="px-6 py-3 bg-neutral-900 text-white font-bold rounded-2xl text-sm hover:bg-neutral-800 transition shadow"
            >
              Open Active Job
            </button>
          </form>
        </div>

        {loading && (
          <div className="bg-white rounded-3xl p-12 border border-neutral-200 flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-neutral-600 font-semibold text-sm">Loading dispatch details &amp; GPS coordinates...</p>
          </div>
        )}

        {error && !loading && (
          <div className="bg-white p-8 rounded-3xl border border-neutral-200 shadow-sm text-center">
            <div className="w-12 h-12 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-3 text-xl font-bold">
              !
            </div>
            <h2 className="text-lg font-bold text-neutral-900 mb-1">Dispatch Not Found</h2>
            <p className="text-neutral-500 text-sm max-w-md mx-auto">{error}</p>
          </div>
        )}

        {!booking && !loading && !error && (
          <div className="bg-white p-12 rounded-3xl border border-neutral-200 shadow-sm text-center">
            <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3 text-2xl">
              🦺
            </div>
            <h2 className="text-lg font-bold text-neutral-900 mb-1">Partner Dispatch Duty</h2>
            <p className="text-neutral-500 text-sm max-w-md mx-auto">
              Enter your assigned booking code above to view customer location, start GPS navigation, and update trip progress.
            </p>
          </div>
        )}

        {booking && (
          <WorkerConsole
            bookingCode={booking.bookingCode}
            customerName={booking.customerName}
            customerAddress={booking.addressLine}
            customerLocation={{ lat: customerLat, lng: customerLng }}
            customerPhone={booking.customerPhone}
            serviceTitle={booking.items?.[0]?.serviceName || "Home Service Dispatch"}
            fareAmount={booking.totalAmount || 350}
            initialStatus={booking.status}
            apiBaseUrl={apiUrl}
            onSwitchToCustomerView={() => {
              if (typeof window !== "undefined") {
                window.location.href = `/track?code=${encodeURIComponent(booking.bookingCode)}`;
              }
            }}
          />
        )}
      </main>
    </div>
  );
}
