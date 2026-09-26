"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getDefaultApiUrl } from "@the-wings/api-client";
import { DEMO_RIDE_BOOKING, getLastActiveBookingCode } from "@/lib/trackingSync";

const WorkerConsole = dynamic(() => import("@/components/WorkerConsole"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[500px] rounded-3xl bg-neutral-100 flex items-center justify-center animate-pulse border border-neutral-200">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-neutral-500 font-bold">Launching Worker Partner Console & Navigation...</p>
      </div>
    </div>
  )
});

export default function WorkerPage() {
  const [bookingCode, setBookingCode] = useState(DEMO_RIDE_BOOKING.bookingCode);
  const apiUrl = getDefaultApiUrl();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const code = new URLSearchParams(window.location.search).get("code") || getLastActiveBookingCode();
      if (code) {
        setBookingCode(code);
      }
    }
  }, []);

  return (
    <div className="min-h-screen bg-neutral-50/70 pb-20">
      {/* Worker Header */}
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
                <span className="px-2 py-0.5 bg-emerald-500 text-white text-[10px] font-black rounded-md uppercase">
                  Driver Mode
                </span>
              </div>
              <p className="text-[11px] text-neutral-400 font-medium">
                Unified Web Dispatch & Live GPS Navigation
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href={`/track?code=${encodeURIComponent(bookingCode)}&mode=customer`}
              className="px-3.5 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
            >
              <span>👤 Customer Screen</span>
            </Link>

            <Link
              href={`/track?code=${encodeURIComponent(bookingCode)}&mode=split`}
              className="hidden sm:flex px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition items-center gap-1.5 shadow"
            >
              <span>📱 Side-by-Side</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-8 pt-6">
        <WorkerConsole
          bookingCode={bookingCode}
          customerName={DEMO_RIDE_BOOKING.customerName}
          customerAddress={DEMO_RIDE_BOOKING.customerAddress}
          customerLocation={DEMO_RIDE_BOOKING.customerLocation}
          customerPhone={DEMO_RIDE_BOOKING.customerPhone}
          serviceTitle="Emergency Switchboard Fix & MCB Inspection"
          fareAmount={350}
          apiBaseUrl={apiUrl}
          onSwitchToCustomerView={() => {
            if (typeof window !== "undefined") {
              window.location.href = `/track?code=${encodeURIComponent(bookingCode)}&mode=customer`;
            }
          }}
          onSwitchToSplitView={() => {
            if (typeof window !== "undefined") {
              window.location.href = `/track?code=${encodeURIComponent(bookingCode)}&mode=split`;
            }
          }}
        />
      </main>
    </div>
  );
}
