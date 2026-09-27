"use client";

import Link from "next/link";
import { useEffect, useState, FormEvent } from "react";
import { createApiClient } from "@the-wings/api-client";
import type { StaffSummary } from "@the-wings/types";

const TRADE_OPTIONS = [
  { value: "Licensed Electrician", icon: "⚡", desc: "Wiring, MCB, Inverters, Short Circuits" },
  { value: "Master Plumber", icon: "🔧", desc: "Pipes, Leakages, Taps, Sanitary, Motor" },
  { value: "Daily Wage Helper & Labor", icon: "👷", desc: "Loading, Unloading, Material Shifting, Digging" },
  { value: "Master Carpenter", icon: "🪚", desc: "Furniture, Door Locks, Modular Fittings" },
  { value: "Head Mason / Rajmistri", icon: "🧱", desc: "Brickwork, Plaster, Tile Fixing, Concrete" },
  { value: "Master House Painter", icon: "🎨", desc: "Interior, Exterior, Putty, Water-proofing" },
  { value: "AC & Appliance Technician", icon: "❄️", desc: "AC Service, Gas Charging, Fridge, Geyser" },
  { value: "Water Tank Cleaning Specialist", icon: "💧", desc: "Underground & Overhead Tank Deep Wash" },
  { value: "Deep Home Cleaning Pro", icon: "✨", desc: "Full House Deep Sanitization & Wash" },
  { value: "Bathroom & Toilet Cleaning Pro", icon: "🚿", desc: "Acid Wash, Descaling, Stain Removal" },
  { value: "Sofa & Upholstery Cleaning Specialist", icon: "🛋️", desc: "Fabric Shampoo & Steam Vacuum" },
  { value: "Kitchen & Chimney Specialist", icon: "🍳", desc: "Oil Degreasing, Filter Cleansing" },
  { value: "Housemaid & Caregiver", icon: "🧹", desc: "Daily Cooking, Sweeping, Mopping" },
  { value: "Pest Control Specialist", icon: "🛡️", desc: "Termites, Bedbugs, Cockroaches" },
  { value: "Men's Grooming & Salon Pro", icon: "✂️", desc: "Haircut, Shave, Head Massage at Home" },
  { value: "Uniformed Security Guard", icon: "👮", desc: "Residential, Commercial, Event Security" }
];

const GUWAHATI_LOCALITIES = [
  "Beltola",
  "Dispur / Secretariat",
  "GS Road / Christian Basti",
  "Paltan Bazaar / Station",
  "Six Mile / VIP Road",
  "Zoo Road / RG Baruah Road",
  "Chandmari",
  "Jalukbari / University Area",
  "Khanapara",
  "Ulubari / Bhangagarh",
  "Hatigaon",
  "Pan Bazaar / Fancy Bazaar",
  "Lal Ganesh / Odalbakra",
  "Kahilipara",
  "Garchuk / ISBT",
  "Other Guwahati Area"
];

const QUICK_RATES = ["500", "700", "850", "1000", "1200", "1500"];

export default function WorkerRegisterPage() {
  const [activeTab, setActiveTab] = useState<"apply" | "status">("apply");

  // Registration Form State
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [alternatePhone, setAlternatePhone] = useState("");
  const [trade, setTrade] = useState<string>(TRADE_OPTIONS[0]?.value || "Licensed Electrician");
  const [experience, setExperience] = useState<string>("3-5 Years");
  const [locality, setLocality] = useState<string>(GUWAHATI_LOCALITIES[0] || "Beltola");
  const [address, setAddress] = useState("");
  const [dailyRate, setDailyRate] = useState("850");
  const [aadhaarNumber, setAadhaarNumber] = useState("");
  const [emergencyContact, setEmergencyContact] = useState("");
  const [skills, setSkills] = useState("");
  const [agreed, setAgreed] = useState(true);

  // Submission State
  const [submitting, setSubmitting] = useState(false);
  const [submittedData, setSubmittedData] = useState<{
    code: string;
    staff: StaffSummary;
    message: string;
  } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Status Lookup State
  const [searchQuery, setSearchQuery] = useState("");
  const [searchingStatus, setSearchingStatus] = useState(false);
  const [lookupResult, setLookupResult] = useState<StaffSummary | null>(null);
  const [lookupError, setLookupError] = useState<string | null>(null);

  // Copy Feedback
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const ref = new URLSearchParams(window.location.search).get("ref") || "";
      if (ref) {
        setActiveTab("status");
        setSearchQuery(ref);
        handleLookup(ref);
      }
    }
  }, []);

  const handleLookup = async (queryToSearch: string) => {
    if (!queryToSearch.trim()) return;
    setSearchingStatus(true);
    setLookupError(null);
    setLookupResult(null);

    try {
      const client = createApiClient();
      const res = await client.getWorkerRegistrationStatus(queryToSearch.trim());
      setLookupResult(res.data);
    } catch (err: any) {
      setLookupError(err?.message || "No registration found with this reference code or mobile number.");
    } finally {
      setSearchingStatus(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanPhone = phone.trim().replace(/\D/g, "");
    if (cleanPhone.length !== 10) {
      setErrorMessage("Please enter a valid 10-digit Indian mobile number.");
      return;
    }

    if (!agreed) {
      setErrorMessage("Please accept the partner declaration to submit.");
      return;
    }

    setSubmitting(true);

    try {
      const client = createApiClient();
      const res = await client.registerWorker({
        name: name.trim(),
        phone: cleanPhone,
        alternatePhone: alternatePhone.trim() || undefined,
        trade,
        experience,
        locality,
        address: address.trim() || undefined,
        dailyRate: dailyRate.trim() || undefined,
        aadhaarNumber: aadhaarNumber.trim() || undefined,
        emergencyContact: emergencyContact.trim() || undefined,
        skills: skills.trim() || undefined
      });

      setSubmittedData({
        code: res.registrationCode || (res.data as any).registrationCode || "MW-WRK-" + cleanPhone.slice(-4),
        staff: res.data,
        message: res.message
      });

      if (typeof window !== "undefined") {
        const newUrl = `${window.location.pathname}?ref=${encodeURIComponent(res.registrationCode || cleanPhone)}`;
        window.history.replaceState(null, "", newUrl);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || "Registration failed. Please check details and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const copyRefCode = (code: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const fallbackTrade = { value: "Licensed Electrician", icon: "⚡", desc: "Wiring, MCB, Inverters, Short Circuits" };
  const selectedTradeObj = TRADE_OPTIONS.find((t) => t.value === trade) || fallbackTrade;

  return (
    <div className="worker-reg-root">
      {/* Inline styles for responsive layout and micro-interactions */}
      <style>{`
        .worker-reg-root {
          min-height: 100vh;
          background: #f8fafc;
          color: #0f172a;
          font-family: var(--font-sans, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif);
          padding-bottom: 5rem;
          -webkit-tap-highlight-color: transparent;
        }

        .worker-header {
          position: sticky;
          top: 0;
          z-index: 40;
          background: rgba(255, 255, 255, 0.92);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border-bottom: 1px solid #e2e8f0;
          padding: 0.75rem 1rem;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
        }

        .worker-header-inner {
          max-width: 900px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.75rem;
        }

        .brand-link {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          text-decoration: none;
          color: #0f172a;
          font-weight: 800;
          font-size: 1.05rem;
        }

        .brand-badge {
          background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%);
          color: #ffffff;
          padding: 0.25rem 0.5rem;
          border-radius: 8px;
          font-size: 0.85rem;
          font-weight: 900;
          box-shadow: 0 2px 4px rgba(2, 132, 199, 0.2);
        }

        .nav-links {
          display: flex;
          gap: 0.5rem;
          align-items: center;
        }

        .nav-btn {
          font-size: 0.82rem;
          font-weight: 700;
          padding: 0.4rem 0.75rem;
          border-radius: 8px;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 4px;
          transition: all 0.15s ease;
        }

        .nav-btn-secondary {
          color: #475569;
          background: #f1f5f9;
        }

        .nav-btn-secondary:hover {
          background: #e2e8f0;
          color: #0f172a;
        }

        .nav-btn-primary {
          color: #0284c7;
          background: #f0f9ff;
          border: 1px solid #bae6fd;
        }

        .worker-main {
          max-width: 860px;
          margin: 1.25rem auto 0 auto;
          padding: 0 1rem;
        }

        .hero-banner {
          background: linear-gradient(135deg, #091326 0%, #0f172a 60%, #1e293b 100%);
          color: #ffffff;
          border-radius: 20px;
          padding: 1.75rem 1.5rem;
          margin-bottom: 1.5rem;
          box-shadow: 0 12px 30px -8px rgba(15, 23, 42, 0.35);
          position: relative;
          overflow: hidden;
          border: 1px solid rgba(255, 255, 255, 0.08);
        }

        .hero-banner::before {
          content: "";
          position: absolute;
          top: -40px;
          right: -40px;
          width: 180px;
          height: 180px;
          background: radial-gradient(circle, rgba(56, 189, 248, 0.25) 0%, transparent 70%);
          border-radius: 50%;
          pointer-events: none;
        }

        .live-tag {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(56, 189, 248, 0.16);
          border: 1px solid rgba(56, 189, 248, 0.35);
          border-radius: 20px;
          padding: 0.25rem 0.75rem;
          font-size: 0.76rem;
          color: #7dd3fc;
          font-weight: 800;
          letter-spacing: 0.02em;
          margin-bottom: 0.75rem;
        }

        .pulse-dot {
          width: 8px;
          height: 8px;
          background: #38bdf8;
          border-radius: 50%;
          box-shadow: 0 0 8px #38bdf8;
          animation: pulseAnim 2s infinite;
        }

        @keyframes pulseAnim {
          0% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(1.3); }
          100% { opacity: 1; transform: scale(1); }
        }

        .hero-title {
          font-size: 1.6rem;
          font-weight: 900;
          margin: 0 0 0.4rem 0;
          line-height: 1.25;
          letter-spacing: -0.02em;
        }

        .hero-subtitle {
          color: #94a3b8;
          font-size: 0.92rem;
          margin: 0;
          line-height: 1.5;
          max-width: 600px;
        }

        .hero-perks {
          display: flex;
          flex-wrap: wrap;
          gap: 0.75rem;
          margin-top: 1.25rem;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          padding-top: 1.1rem;
        }

        .perk-chip {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 0.82rem;
          color: #e2e8f0;
          background: rgba(255, 255, 255, 0.06);
          padding: 0.3rem 0.65rem;
          border-radius: 8px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          font-weight: 600;
        }

        .segmented-control {
          display: flex;
          background: #e2e8f0;
          padding: 4px;
          border-radius: 12px;
          margin-bottom: 1.5rem;
          gap: 4px;
        }

        .segmented-btn {
          flex: 1;
          padding: 0.65rem 0.75rem;
          font-size: 0.88rem;
          font-weight: 800;
          border-radius: 9px;
          border: none;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          min-height: 42px;
        }

        .segmented-btn.active {
          background: #ffffff;
          color: #0284c7;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
        }

        .segmented-btn.inactive {
          background: transparent;
          color: #64748b;
        }

        .segmented-btn.inactive:hover {
          color: #1e293b;
        }

        .card-surface {
          background: #ffffff;
          border-radius: 18px;
          border: 1px solid #e2e8f0;
          padding: 1.5rem;
          box-shadow: 0 4px 16px -2px rgba(15, 23, 42, 0.04);
        }

        .section-header {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 1.25rem;
          padding-bottom: 0.75rem;
          border-bottom: 1px solid #f1f5f9;
        }

        .section-badge {
          width: 28px;
          height: 28px;
          border-radius: 8px;
          background: #0284c7;
          color: #fff;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 0.82rem;
          font-weight: 900;
        }

        .section-title {
          font-size: 1.05rem;
          font-weight: 800;
          color: #0f172a;
          margin: 0;
        }

        .section-sub {
          font-size: 0.8rem;
          color: #64748b;
          margin: 0;
        }

        .form-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
          gap: 1.15rem;
          margin-bottom: 1.25rem;
        }

        .field-group {
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
        }

        .field-label {
          font-size: 0.84rem;
          font-weight: 750;
          color: #334155;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .required-star {
          color: #ef4444;
          font-weight: 800;
        }

        .input-with-prefix {
          display: flex;
          align-items: stretch;
          border: 1px solid #cbd5e1;
          border-radius: 10px;
          overflow: hidden;
          background: #ffffff;
          transition: border-color 0.15s ease, box-shadow 0.15s ease;
        }

        .input-with-prefix:focus-within {
          border-color: #0284c7;
          box-shadow: 0 0 0 3px rgba(2, 132, 199, 0.15);
        }

        .prefix-badge {
          background: #f1f5f9;
          border-right: 1px solid #cbd5e1;
          padding: 0 0.75rem;
          display: flex;
          align-items: center;
          font-size: 0.88rem;
          font-weight: 700;
          color: #475569;
          user-select: none;
        }

        .text-input,
        .select-input,
        .textarea-input {
          width: 100%;
          padding: 0.7rem 0.85rem;
          border-radius: 10px;
          border: 1px solid #cbd5e1;
          font-size: 0.95rem;
          outline: none;
          background: #ffffff;
          box-sizing: border-box;
          transition: border-color 0.15s ease, box-shadow 0.15s ease;
          color: #0f172a;
          font-family: inherit;
        }

        .input-with-prefix .text-input {
          border: none;
          border-radius: 0;
        }

        .text-input:focus,
        .select-input:focus,
        .textarea-input:focus {
          border-color: #0284c7;
          box-shadow: 0 0 0 3px rgba(2, 132, 199, 0.15);
        }

        .chip-container {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-top: 0.4rem;
        }

        .rate-chip {
          padding: 0.35rem 0.65rem;
          font-size: 0.8rem;
          font-weight: 700;
          border-radius: 8px;
          border: 1px solid #cbd5e1;
          background: #f8fafc;
          color: #334155;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .rate-chip:hover {
          background: #f1f5f9;
          border-color: #94a3b8;
        }

        .rate-chip.selected {
          background: #0284c7;
          color: #ffffff;
          border-color: #0284c7;
          box-shadow: 0 2px 4px rgba(2, 132, 199, 0.25);
        }

        .trade-preview-card {
          background: #f0f9ff;
          border: 1px solid #bae6fd;
          border-radius: 12px;
          padding: 0.85rem 1rem;
          margin-top: 0.5rem;
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .trade-icon-lg {
          font-size: 1.8rem;
          line-height: 1;
        }

        .declaration-box {
          background: #f8fafc;
          border: 1.5px dashed #cbd5e1;
          border-radius: 12px;
          padding: 1rem 1.15rem;
          margin: 1.25rem 0 1.5rem 0;
        }

        .submit-btn {
          width: 100%;
          min-height: 52px;
          padding: 0.9rem 1.5rem;
          border-radius: 12px;
          background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%);
          color: #ffffff;
          border: none;
          font-size: 1.05rem;
          font-weight: 900;
          cursor: pointer;
          box-shadow: 0 4px 14px rgba(2, 132, 199, 0.3);
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .submit-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(2, 132, 199, 0.4);
        }

        .submit-btn:active:not(:disabled) {
          transform: translateY(1px);
        }

        .submit-btn:disabled {
          background: #94a3b8;
          cursor: not-allowed;
          box-shadow: none;
        }

        @media (max-width: 640px) {
          .hero-banner {
            padding: 1.25rem 1rem;
            border-radius: 16px;
          }
          .hero-title {
            font-size: 1.35rem;
          }
          .card-surface {
            padding: 1.15rem;
            border-radius: 16px;
          }
          .form-grid {
            grid-template-columns: 1fr;
            gap: 1rem;
          }
          .submit-btn {
            font-size: 0.98rem;
            min-height: 48px;
          }
        }
      `}</style>

      {/* Top Mobile-Responsive Navigation Header */}
      <header className="worker-header">
        <div className="worker-header-inner">
          <Link href="/" className="brand-link">
            <span className="brand-badge">MW</span>
            <span>Marac Workers</span>
          </Link>
          <div className="nav-links">
            <Link href="/worker" className="nav-btn nav-btn-secondary">
              <span>Console</span>
              <span style={{ fontSize: "0.9rem" }}>→</span>
            </Link>
            <Link href="/" className="nav-btn nav-btn-primary">
              <span>Services</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="worker-main">
        {/* Hero Banner */}
        <div className="hero-banner">
          <div className="live-tag">
            <span className="pulse-dot" />
            <span>Direct Partner Dispatch Network</span>
          </div>
          <h1 className="hero-title">Join as a Verified Trade Partner</h1>
          <p className="hero-subtitle">
            Earn fair daily wages across Guwahati. Direct customer bookings, zero visit commission, and official admin partner certification.
          </p>

          <div className="hero-perks">
            <div className="perk-chip">
              <span style={{ color: "#22c55e", fontWeight: 900 }}>✓</span> ₹0 Visit Commission
            </div>
            <div className="perk-chip">
              <span style={{ color: "#22c55e", fontWeight: 900 }}>✓</span> Direct Customer Calling
            </div>
            <div className="perk-chip">
              <span style={{ color: "#22c55e", fontWeight: 900 }}>✓</span> Fast Admin Verification
            </div>
            <div className="perk-chip">
              <span style={{ color: "#22c55e", fontWeight: 900 }}>✓</span> Daily Work Guarantee
            </div>
          </div>
        </div>

        {/* Segmented Tab Switcher */}
        <div className="segmented-control">
          <button
            type="button"
            onClick={() => setActiveTab("apply")}
            className={`segmented-btn ${activeTab === "apply" ? "active" : "inactive"}`}
          >
            <span>📝</span>
            <span>Register as Partner</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("status")}
            className={`segmented-btn ${activeTab === "status" ? "active" : "inactive"}`}
          >
            <span>🔍</span>
            <span>Check Application Status</span>
          </button>
        </div>

        {/* TAB 1: Worker Application Form */}
        {activeTab === "apply" && (
          <div>
            {submittedData ? (
              /* Success & Verification Timeline Card */
              <div className="card-surface" style={{ border: "1.5px solid #86efac", background: "#ffffff" }}>
                <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
                  <div
                    style={{
                      width: "60px",
                      height: "60px",
                      borderRadius: "50%",
                      background: "linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)",
                      color: "#15803d",
                      fontSize: "1.85rem",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginBottom: "0.75rem",
                      boxShadow: "0 4px 12px rgba(22, 163, 74, 0.2)"
                    }}
                  >
                    ✓
                  </div>
                  <h2 style={{ fontSize: "1.45rem", fontWeight: 900, color: "#14532d", margin: "0 0 0.35rem 0" }}>
                    Registration Submitted!
                  </h2>
                  <p style={{ color: "#475569", fontSize: "0.9rem", margin: 0, lineHeight: 1.5 }}>
                    Your partner application is in the Marac Workers verification queue. Our operations team will verify your credentials and activate dispatch.
                  </p>
                </div>

                {/* Application Reference Code Banner */}
                <div
                  style={{
                    background: "#f8fafc",
                    border: "1.5px solid #e2e8f0",
                    borderRadius: "14px",
                    padding: "1.1rem 1.25rem",
                    marginBottom: "1.5rem",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: "0.75rem"
                  }}
                >
                  <div>
                    <span style={{ fontSize: "0.72rem", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 800 }}>
                      Application Reference Code
                    </span>
                    <div style={{ fontSize: "1.35rem", fontWeight: 900, color: "#0f172a", fontFamily: "monospace", letterSpacing: "0.04em" }}>
                      {submittedData.code}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyRefCode(submittedData.code)}
                    style={{
                      padding: "0.5rem 1rem",
                      borderRadius: "8px",
                      background: copied ? "#16a34a" : "#0284c7",
                      color: "#ffffff",
                      border: "none",
                      fontWeight: 800,
                      fontSize: "0.85rem",
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      transition: "background 0.15s ease"
                    }}
                  >
                    <span>{copied ? "✓ Copied!" : "📋 Copy Code"}</span>
                  </button>
                </div>

                {/* Verification Process Tracker */}
                <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: "1.25rem", marginBottom: "1.5rem" }}>
                  <h3 style={{ fontSize: "0.95rem", fontWeight: 800, color: "#1e293b", margin: "0 0 1rem 0" }}>
                    What Happens Next?
                  </h3>
                  <div style={{ display: "grid", gap: "0.85rem" }}>
                    <div style={{ display: "flex", gap: "0.75rem", alignItems: "start" }}>
                      <span style={{ background: "#22c55e", color: "#fff", width: "26px", height: "26px", borderRadius: "50%", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: "0.75rem", fontWeight: 800, flexShrink: 0 }}>
                        1
                      </span>
                      <div>
                        <strong style={{ fontSize: "0.88rem", display: "block", color: "#0f172a" }}>Application Recorded</strong>
                        <small style={{ color: "#64748b" }}>Logged with selected trade ({trade}) and locality ({locality}).</small>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: "0.75rem", alignItems: "start" }}>
                      <span style={{ background: "#f59e0b", color: "#fff", width: "26px", height: "26px", borderRadius: "50%", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: "0.75rem", fontWeight: 800, flexShrink: 0 }}>
                        2
                      </span>
                      <div>
                        <strong style={{ fontSize: "0.88rem", display: "block", color: "#0f172a" }}>Admin Identity &amp; Skill Check (In Progress)</strong>
                        <small style={{ color: "#64748b" }}>Admin verifies your trade experience and contact number.</small>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: "0.75rem", alignItems: "start" }}>
                      <span style={{ background: "#94a3b8", color: "#fff", width: "26px", height: "26px", borderRadius: "50%", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: "0.75rem", fontWeight: 800, flexShrink: 0 }}>
                        3
                      </span>
                      <div>
                        <strong style={{ fontSize: "0.88rem", display: "block", color: "#0f172a" }}>Account Activation &amp; Dispatch</strong>
                        <small style={{ color: "#64748b" }}>Once approved, you receive customer jobs directly via phone &amp; WhatsApp.</small>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                  <a
                    href={`https://wa.me/919774887803?text=${encodeURIComponent(`Hi Marac Admin, I have submitted my partner registration (Ref: ${submittedData.code}) for ${trade} in ${locality}. Please expedite my verification.`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      flex: 1,
                      minWidth: "220px",
                      textAlign: "center",
                      padding: "0.85rem 1.25rem",
                      borderRadius: "10px",
                      background: "#16a34a",
                      color: "#ffffff",
                      textDecoration: "none",
                      fontWeight: 800,
                      fontSize: "0.92rem",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "8px",
                      boxShadow: "0 4px 12px rgba(22, 163, 74, 0.25)"
                    }}
                  >
                    <span>💬 WhatsApp Admin to Expedite Review</span>
                  </a>
                  <button
                    type="button"
                    onClick={() => {
                      setSubmittedData(null);
                      setName("");
                      setPhone("");
                      setAddress("");
                      setAadhaarNumber("");
                    }}
                    style={{
                      padding: "0.85rem 1.25rem",
                      borderRadius: "10px",
                      background: "#f1f5f9",
                      color: "#475569",
                      border: "none",
                      fontWeight: 750,
                      fontSize: "0.88rem",
                      cursor: "pointer"
                    }}
                  >
                    Submit Another Application
                  </button>
                </div>
              </div>
            ) : (
              /* Application Form Container */
              <form onSubmit={handleSubmit} className="card-surface">
                {errorMessage && (
                  <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "10px", padding: "0.85rem 1rem", color: "#991b1b", fontSize: "0.88rem", marginBottom: "1.25rem", display: "flex", alignItems: "center", gap: "8px" }}>
                    <span>⚠️</span>
                    <span>{errorMessage}</span>
                  </div>
                )}

                {/* Section 1: Personal & Contact */}
                <div className="section-header">
                  <span className="section-badge">1</span>
                  <div>
                    <h2 className="section-title">Personal &amp; Contact Details</h2>
                    <p className="section-sub">Your basic contact information for customer dispatches</p>
                  </div>
                </div>

                <div className="form-grid">
                  {/* Name */}
                  <div className="field-group">
                    <label className="field-label">
                      <span>👤 Full Name</span>
                      <span className="required-star">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Pranab Barman"
                      className="text-input"
                    />
                  </div>

                  {/* Primary Mobile */}
                  <div className="field-group">
                    <label className="field-label">
                      <span>📞 Calling Mobile Number</span>
                      <span className="required-star">*</span>
                    </label>
                    <div className="input-with-prefix">
                      <span className="prefix-badge">+91</span>
                      <input
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                        placeholder="10-digit mobile"
                        maxLength={10}
                        className="text-input"
                      />
                    </div>
                  </div>

                  {/* Alternate Phone */}
                  <div className="field-group">
                    <label className="field-label">
                      <span>💬 WhatsApp / Alt Phone</span>
                      <span style={{ fontSize: "0.75rem", color: "#94a3b8", fontWeight: 500 }}>(Optional)</span>
                    </label>
                    <div className="input-with-prefix">
                      <span className="prefix-badge">+91</span>
                      <input
                        type="tel"
                        value={alternatePhone}
                        onChange={(e) => setAlternatePhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                        placeholder="Alternative number"
                        maxLength={10}
                        className="text-input"
                      />
                    </div>
                  </div>
                </div>

                {/* Section 2: Trade & Coverage */}
                <div className="section-header" style={{ marginTop: "1.5rem" }}>
                  <span className="section-badge">2</span>
                  <div>
                    <h2 className="section-title">Trade Specialization &amp; Area</h2>
                    <p className="section-sub">Select your primary trade and preferred coverage locality in Guwahati</p>
                  </div>
                </div>

                <div className="form-grid">
                  {/* Primary Trade */}
                  <div className="field-group">
                    <label className="field-label">
                      <span>🛠️ Primary Trade</span>
                      <span className="required-star">*</span>
                    </label>
                    <select
                      value={trade}
                      onChange={(e) => setTrade(e.target.value)}
                      className="select-input"
                    >
                      {TRADE_OPTIONS.map((t) => (
                        <option key={t.value} value={t.value}>
                          {t.icon} {t.value}
                        </option>
                      ))}
                    </select>

                    {/* Trade helper preview */}
                    <div className="trade-preview-card">
                      <span className="trade-icon-lg">{selectedTradeObj.icon}</span>
                      <div>
                        <strong style={{ fontSize: "0.85rem", color: "#0369a1", display: "block" }}>{selectedTradeObj.value}</strong>
                        <span style={{ fontSize: "0.76rem", color: "#475569" }}>{selectedTradeObj.desc}</span>
                      </div>
                    </div>
                  </div>

                  {/* Experience */}
                  <div className="field-group">
                    <label className="field-label">
                      <span>⏱️ Years of Experience</span>
                    </label>
                    <select
                      value={experience}
                      onChange={(e) => setExperience(e.target.value)}
                      className="select-input"
                    >
                      <option value="Less than 1 Year">Less than 1 Year (Helper/Apprentice)</option>
                      <option value="1-2 Years">1-2 Years (Junior Technician)</option>
                      <option value="3-5 Years">3-5 Years (Experienced Tradesperson)</option>
                      <option value="5-10 Years">5-10 Years (Senior Pro / Mistri)</option>
                      <option value="10+ Years">10+ Years (Master Craftsman)</option>
                    </select>
                  </div>

                  {/* Preferred Locality */}
                  <div className="field-group">
                    <label className="field-label">
                      <span>📍 Guwahati Service Locality</span>
                      <span className="required-star">*</span>
                    </label>
                    <select
                      value={locality}
                      onChange={(e) => setLocality(e.target.value)}
                      className="select-input"
                    >
                      {GUWAHATI_LOCALITIES.map((loc) => (
                        <option key={loc} value={loc}>
                          {loc}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Expected Daily Rate */}
                  <div className="field-group">
                    <label className="field-label">
                      <span>💰 Expected Rate per Day / Visit (₹)</span>
                    </label>
                    <div className="input-with-prefix">
                      <span className="prefix-badge">₹</span>
                      <input
                        type="number"
                        value={dailyRate}
                        onChange={(e) => setDailyRate(e.target.value)}
                        placeholder="e.g. 850"
                        className="text-input"
                      />
                    </div>
                    {/* Quick rate chips */}
                    <div className="chip-container">
                      {QUICK_RATES.map((r) => (
                        <button
                          key={r}
                          type="button"
                          onClick={() => setDailyRate(r)}
                          className={`rate-chip ${dailyRate === r ? "selected" : ""}`}
                        >
                          ₹{r}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Section 3: Identity & Address */}
                <div className="section-header" style={{ marginTop: "1.5rem" }}>
                  <span className="section-badge">3</span>
                  <div>
                    <h2 className="section-title">Identity Proof &amp; Verification</h2>
                    <p className="section-sub">Required by Admin for security and background verification</p>
                  </div>
                </div>

                <div className="form-grid">
                  {/* Aadhaar Number */}
                  <div className="field-group">
                    <label className="field-label">
                      <span>🪪 Aadhaar / Voter ID Number</span>
                      <span style={{ fontSize: "0.75rem", color: "#94a3b8", fontWeight: 500 }}>(Admin verified)</span>
                    </label>
                    <input
                      type="text"
                      value={aadhaarNumber}
                      onChange={(e) => setAadhaarNumber(e.target.value)}
                      placeholder="e.g. 12-digit Aadhaar / ID"
                      className="text-input"
                    />
                  </div>

                  {/* Emergency Contact */}
                  <div className="field-group">
                    <label className="field-label">
                      <span>🆘 Emergency Contact (Family)</span>
                    </label>
                    <input
                      type="text"
                      value={emergencyContact}
                      onChange={(e) => setEmergencyContact(e.target.value)}
                      placeholder="e.g. Brother: Subhash - 9876543210"
                      className="text-input"
                    />
                  </div>
                </div>

                {/* Home Address */}
                <div className="field-group" style={{ marginBottom: "1.15rem" }}>
                  <label className="field-label">
                    <span>🏠 Home / Workshop Address in Guwahati</span>
                  </label>
                  <textarea
                    rows={2}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="House / Room no, road name, nearby landmark..."
                    className="textarea-input"
                  />
                </div>

                {/* Specific Skills */}
                <div className="field-group" style={{ marginBottom: "1.25rem" }}>
                  <label className="field-label">
                    <span>⚡ Key Tools &amp; Special Skills</span>
                  </label>
                  <input
                    type="text"
                    value={skills}
                    onChange={(e) => setSkills(e.target.value)}
                    placeholder="e.g. PPR pipe welding, inverter battery setup, tile cutting machine"
                    className="text-input"
                  />
                </div>

                {/* Declaration Box */}
                <div className="declaration-box">
                  <label style={{ display: "flex", gap: "10px", alignItems: "start", fontSize: "0.85rem", color: "#475569", cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={agreed}
                      onChange={(e) => setAgreed(e.target.checked)}
                      style={{ marginTop: "2px", width: "18px", height: "18px", accentColor: "#0284c7" }}
                    />
                    <span>
                      <strong>Partner Declaration:</strong> I confirm that all trade details and credentials provided above are genuine. I understand that Marac Workers Admin will perform background and identity verification before activating my account for customer dispatch.
                    </span>
                  </label>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={submitting}
                  className="submit-btn"
                >
                  {submitting ? (
                    <>
                      <span style={{ display: "inline-block", width: "18px", height: "18px", border: "2px solid #fff", borderTopColor: "transparent", borderRadius: "50%", animation: "pulseAnim 0.8s linear infinite" }} />
                      <span>Submitting Registration...</span>
                    </>
                  ) : (
                    <>
                      <span>Submit Application for Admin Verification</span>
                      <span style={{ fontSize: "1.1rem" }}>→</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        )}

        {/* TAB 2: Application Status Lookup */}
        {activeTab === "status" && (
          <div className="card-surface">
            <h2 style={{ fontSize: "1.25rem", fontWeight: 800, margin: "0 0 0.35rem 0", color: "#0f172a" }}>
              Check Application Status
            </h2>
            <p style={{ color: "#64748b", fontSize: "0.88rem", margin: "0 0 1.25rem 0", lineHeight: 1.5 }}>
              Enter your 10-digit mobile number or Application Reference Code (e.g. MW-WRK-...) to check your live verification and dispatch state.
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleLookup(searchQuery);
              }}
              style={{ display: "flex", gap: "0.65rem", marginBottom: "1.5rem", flexWrap: "wrap" }}
            >
              <input
                type="text"
                required
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Enter 10-digit mobile or MW-WRK-..."
                className="text-input"
                style={{ flex: 1, minWidth: "220px" }}
              />
              <button
                type="submit"
                disabled={searchingStatus}
                style={{
                  padding: "0.75rem 1.4rem",
                  borderRadius: "10px",
                  background: "#0284c7",
                  color: "#ffffff",
                  border: "none",
                  fontWeight: 800,
                  fontSize: "0.92rem",
                  cursor: searchingStatus ? "not-allowed" : "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px"
                }}
              >
                {searchingStatus ? "Checking..." : "🔍 Check Status"}
              </button>
            </form>

            {lookupError && (
              <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "10px", padding: "1rem", color: "#991b1b", fontSize: "0.88rem", marginBottom: "1.25rem" }}>
                ⚠️ {lookupError}
              </div>
            )}

            {lookupResult && (
              <div
                style={{
                  border: "1.5px solid #e2e8f0",
                  borderRadius: "14px",
                  padding: "1.25rem",
                  background: "#f8fafc"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "1rem", flexWrap: "wrap", gap: "0.5rem" }}>
                  <div>
                    <h3 style={{ fontSize: "1.15rem", fontWeight: 800, margin: "0 0 0.25rem 0", color: "#0f172a" }}>
                      {lookupResult.name}
                    </h3>
                    <div style={{ fontSize: "0.84rem", color: "#64748b" }}>
                      <strong>{lookupResult.role}</strong> • 📍 {lookupResult.locality || "Guwahati"}
                    </div>
                  </div>

                  <div>
                    {lookupResult.verificationStatus === "APPROVED" || lookupResult.isActive ? (
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "#dcfce7", color: "#15803d", fontWeight: 800, padding: "0.35rem 0.85rem", borderRadius: "20px", fontSize: "0.82rem", border: "1px solid #bbf7d0" }}>
                        ✓ Verified &amp; Active Partner
                      </span>
                    ) : lookupResult.verificationStatus === "REJECTED" ? (
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "#fee2e2", color: "#b91c1c", fontWeight: 800, padding: "0.35rem 0.85rem", borderRadius: "20px", fontSize: "0.82rem", border: "1px solid #fecaca" }}>
                        ✕ Application Rejected
                      </span>
                    ) : (
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "#fef3c7", color: "#b45309", fontWeight: 800, padding: "0.35rem 0.85rem", borderRadius: "20px", fontSize: "0.82rem", border: "1px solid #fde68a" }}>
                        ⏳ Pending Admin Verification
                      </span>
                    )}
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "0.65rem", fontSize: "0.84rem", borderTop: "1px solid #e2e8f0", paddingTop: "0.85rem" }}>
                  <div>
                    <span style={{ color: "#64748b" }}>Reference Code:</span>{" "}
                    <strong>{lookupResult.registrationCode || "MW-WRK-" + lookupResult.phone.slice(-4)}</strong>
                  </div>
                  <div>
                    <span style={{ color: "#64748b" }}>Phone:</span>{" "}
                    <strong>{lookupResult.phone}</strong>
                  </div>
                  <div>
                    <span style={{ color: "#64748b" }}>Experience:</span>{" "}
                    <strong>{lookupResult.experience || "3-5 Years"}</strong>
                  </div>
                  <div>
                    <span style={{ color: "#64748b" }}>Registered Date:</span>{" "}
                    <strong>{lookupResult.createdAt ? new Date(lookupResult.createdAt).toLocaleDateString() : "Recent"}</strong>
                  </div>
                </div>

                {lookupResult.verificationNotes && (
                  <div style={{ marginTop: "0.85rem", padding: "0.75rem", background: "#ffffff", borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "0.84rem" }}>
                    <strong style={{ color: "#475569" }}>Admin Feedback:</strong>{" "}
                    <span style={{ color: "#0f172a" }}>{lookupResult.verificationNotes}</span>
                  </div>
                )}

                {lookupResult.verificationStatus === "APPROVED" && (
                  <div style={{ marginTop: "1rem", padding: "0.85rem", background: "#dcfce7", borderRadius: "8px", color: "#14532d", fontSize: "0.88rem" }}>
                    🎉 <strong>Congratulations!</strong> Your partner account is verified. You will receive customer dispatch calls and WhatsApp alerts in your locality.
                  </div>
                )}

                {lookupResult.verificationStatus !== "APPROVED" && (
                  <div style={{ marginTop: "1rem", display: "flex", justifyContent: "flex-end" }}>
                    <a
                      href={`https://wa.me/919774887803?text=${encodeURIComponent(`Hi Marac Admin, following up on my worker registration (Ref: ${lookupResult.registrationCode || lookupResult.phone}). Please update on verification.`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        fontSize: "0.82rem",
                        color: "#16a34a",
                        fontWeight: 700,
                        textDecoration: "none",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px"
                      }}
                    >
                      <span>💬 Contact Admin on WhatsApp</span>
                      <span>→</span>
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
