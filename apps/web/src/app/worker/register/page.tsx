"use client";

import Link from "next/link";
import { useEffect, useState, FormEvent } from "react";
import { createApiClient } from "@the-wings/api-client";
import type { StaffSummary } from "@the-wings/types";

const TRADE_OPTIONS = [
  "Licensed Electrician",
  "Master Plumber",
  "Daily Wage Helper & Labor",
  "Master Carpenter",
  "Head Mason / Rajmistri",
  "Master House Painter",
  "AC & Appliance Technician",
  "Water Tank Cleaning Specialist",
  "Deep Home Cleaning Pro",
  "Bathroom & Toilet Cleaning Pro",
  "Sofa & Upholstery Cleaning Specialist",
  "Kitchen & Chimney Specialist",
  "Housemaid & Caregiver",
  "Pest Control Specialist",
  "Men's Grooming & Salon Pro",
  "Uniformed Security Guard"
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

export default function WorkerRegisterPage() {
  const [activeTab, setActiveTab] = useState<"apply" | "status">("apply");

  // Registration Form State
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [alternatePhone, setAlternatePhone] = useState("");
  const [trade, setTrade] = useState<string>(TRADE_OPTIONS[0] || "Licensed Electrician");
  const [experience, setExperience] = useState<string>("3-5 Years");
  const [locality, setLocality] = useState<string>(GUWAHATI_LOCALITIES[0] || "Paltan Bazaar / Panbazar");
  const [address, setAddress] = useState("");
  const [dailyRate, setDailyRate] = useState("");
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
      setLookupError(err?.message || "No registration found with this code or mobile number.");
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
      setErrorMessage("Please accept the trade partner declaration to submit.");
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

      // Update URL with ref
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

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f8fafc", color: "#0f172a", fontFamily: "var(--font-sans, system-ui, sans-serif)", paddingBottom: "4rem" }}>
      {/* Top Header */}
      <header style={{ position: "sticky", top: 0, zIndex: 30, background: "#ffffff", borderBottom: "1px solid #e2e8f0", padding: "0.85rem 1.25rem", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
        <div style={{ maxWidth: "1000px", margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: "0.5rem", textDecoration: "none", color: "#0f172a", fontWeight: 800, fontSize: "1.1rem" }}>
            <span style={{ background: "#0284c7", color: "#ffffff", padding: "0.25rem 0.55rem", borderRadius: "6px", fontSize: "0.95rem" }}>MW</span>
            <span>Marac Workers</span>
          </Link>
          <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
            <Link href="/worker" style={{ fontSize: "0.85rem", color: "#475569", textDecoration: "none", fontWeight: 600, padding: "0.35rem 0.75rem", borderRadius: "6px", background: "#f1f5f9" }}>
              Dispatch Console →
            </Link>
            <Link href="/" style={{ fontSize: "0.85rem", color: "#0284c7", textDecoration: "none", fontWeight: 700 }}>
              Storefront
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main style={{ maxWidth: "800px", margin: "2rem auto 0 auto", padding: "0 1rem" }}>
        {/* Banner Hero */}
        <div style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)", color: "#ffffff", borderRadius: "16px", padding: "2rem", marginBottom: "2rem", boxShadow: "0 10px 25px -5px rgba(15,23,42,0.2)" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "rgba(56, 189, 248, 0.15)", border: "1px solid rgba(56, 189, 248, 0.3)", borderRadius: "20px", padding: "0.25rem 0.75rem", fontSize: "0.8rem", color: "#38bdf8", fontWeight: 700, marginBottom: "0.75rem" }}>
            <span>●</span> Partner Onboarding &amp; Verification
          </div>
          <h1 style={{ fontSize: "1.85rem", fontWeight: 800, margin: "0 0 0.5rem 0", lineHeight: 1.25 }}>
            Join as a Verified Trade Worker
          </h1>
          <p style={{ color: "#cbd5e1", fontSize: "0.95rem", margin: 0, lineHeight: 1.5, maxWidth: "620px" }}>
            Get direct customer bookings across Guwahati, guaranteed fair daily rates, 100% transparent payouts, and verified partner credentials.
          </p>

          <div style={{ display: "flex", flexWrap: "wrap", gap: "1.2rem", marginTop: "1.5rem", borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: "1.2rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.85rem", color: "#e2e8f0" }}>
              <span style={{ color: "#22c55e", fontWeight: 900 }}>✓</span> Zero visit commissions
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.85rem", color: "#e2e8f0" }}>
              <span style={{ color: "#22c55e", fontWeight: 900 }}>✓</span> Direct customer phone connect
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.85rem", color: "#e2e8f0" }}>
              <span style={{ color: "#22c55e", fontWeight: 900 }}>✓</span> Verified Admin ID card
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div style={{ display: "flex", borderBottom: "2px solid #e2e8f0", marginBottom: "1.75rem", gap: "0.5rem" }}>
          <button
            type="button"
            onClick={() => setActiveTab("apply")}
            style={{
              padding: "0.75rem 1.25rem",
              fontSize: "0.95rem",
              fontWeight: 700,
              background: "transparent",
              border: "none",
              cursor: "pointer",
              color: activeTab === "apply" ? "#0284c7" : "#64748b",
              borderBottom: activeTab === "apply" ? "3px solid #0284c7" : "3px solid transparent",
              marginBottom: "-2px",
              transition: "all 0.15s ease"
            }}
          >
            New Worker Application
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("status")}
            style={{
              padding: "0.75rem 1.25rem",
              fontSize: "0.95rem",
              fontWeight: 700,
              background: "transparent",
              border: "none",
              cursor: "pointer",
              color: activeTab === "status" ? "#0284c7" : "#64748b",
              borderBottom: activeTab === "status" ? "3px solid #0284c7" : "3px solid transparent",
              marginBottom: "-2px",
              transition: "all 0.15s ease"
            }}
          >
            Check Application Status
          </button>
        </div>

        {/* Tab 1: Apply Form */}
        {activeTab === "apply" && (
          <div>
            {submittedData ? (
              /* Success Screen */
              <div style={{ background: "#ffffff", borderRadius: "14px", border: "1px solid #bbf7d0", padding: "2rem", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}>
                <div style={{ textAlign: "center", marginBottom: "1.75rem" }}>
                  <div style={{ width: "56px", height: "56px", borderRadius: "50%", background: "#dcfce7", color: "#16a34a", fontSize: "1.75rem", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: "1rem" }}>
                    ✓
                  </div>
                  <h2 style={{ fontSize: "1.5rem", fontWeight: 800, margin: "0 0 0.5rem 0", color: "#14532d" }}>
                    Registration Submitted Successfully!
                  </h2>
                  <p style={{ color: "#475569", fontSize: "0.95rem", margin: 0 }}>
                    Your application is in the Marac Workers verification queue. Our admin team will verify your details and activate your partner dispatch status.
                  </p>
                </div>

                {/* Application Reference Card */}
                <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "1.25rem", marginBottom: "1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
                  <div>
                    <span style={{ fontSize: "0.75rem", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 700 }}>
                      Application Reference Code
                    </span>
                    <div style={{ fontSize: "1.35rem", fontWeight: 800, color: "#0f172a", fontFamily: "monospace", letterSpacing: "0.03em" }}>
                      {submittedData.code}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyRefCode(submittedData.code)}
                    style={{
                      padding: "0.45rem 0.9rem",
                      borderRadius: "6px",
                      background: copied ? "#22c55e" : "#0284c7",
                      color: "#ffffff",
                      border: "none",
                      fontWeight: 700,
                      fontSize: "0.85rem",
                      cursor: "pointer",
                      transition: "background 0.15s ease"
                    }}
                  >
                    {copied ? "✓ Copied!" : "Copy Code"}
                  </button>
                </div>

                {/* Verification Timeline */}
                <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: "1.5rem", marginBottom: "1.75rem" }}>
                  <h3 style={{ fontSize: "0.95rem", fontWeight: 700, color: "#334155", marginBottom: "1rem" }}>
                    Verification Process
                  </h3>
                  <div style={{ display: "grid", gap: "1rem" }}>
                    <div style={{ display: "flex", gap: "0.75rem", alignItems: "start" }}>
                      <span style={{ background: "#22c55e", color: "#fff", width: "24px", height: "24px", borderRadius: "50%", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: "0.75rem", fontWeight: 800 }}>1</span>
                      <div>
                        <strong style={{ fontSize: "0.9rem", display: "block", color: "#0f172a" }}>Application Received</strong>
                        <small style={{ color: "#64748b" }}>Details and trade preferences logged in the database.</small>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: "0.75rem", alignItems: "start" }}>
                      <span style={{ background: "#f59e0b", color: "#fff", width: "24px", height: "24px", borderRadius: "50%", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: "0.75rem", fontWeight: 800 }}>2</span>
                      <div>
                        <strong style={{ fontSize: "0.9rem", display: "block", color: "#0f172a" }}>Admin Identity &amp; Skill Verification (In Progress)</strong>
                        <small style={{ color: "#64748b" }}>Admin checks mobile number, Aadhaar, trade experience, and area coverage.</small>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: "0.75rem", alignItems: "start" }}>
                      <span style={{ background: "#94a3b8", color: "#fff", width: "24px", height: "24px", borderRadius: "50%", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: "0.75rem", fontWeight: 800 }}>3</span>
                      <div>
                        <strong style={{ fontSize: "0.9rem", display: "block", color: "#0f172a" }}>Activation &amp; Welcome Message</strong>
                        <small style={{ color: "#64748b" }}>Once approved, you receive an automated WhatsApp confirmation and job dispatch alerts.</small>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                  <a
                    href={`https://wa.me/919774887803?text=${encodeURIComponent(`Hi Marac Admin, I have submitted my worker registration (Ref: ${submittedData.code}) for ${trade}. Please expedite my verification.`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      flex: 1,
                      minWidth: "220px",
                      textAlign: "center",
                      padding: "0.75rem 1.25rem",
                      borderRadius: "8px",
                      background: "#22c55e",
                      color: "#ffffff",
                      textDecoration: "none",
                      fontWeight: 700,
                      fontSize: "0.9rem"
                    }}
                  >
                    💬 WhatsApp Admin to Expedite Review
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
                      padding: "0.75rem 1.25rem",
                      borderRadius: "8px",
                      background: "#f1f5f9",
                      color: "#475569",
                      border: "none",
                      fontWeight: 700,
                      fontSize: "0.9rem",
                      cursor: "pointer"
                    }}
                  >
                    Submit Another Application
                  </button>
                </div>
              </div>
            ) : (
              /* Application Form */
              <form onSubmit={handleSubmit} style={{ background: "#ffffff", borderRadius: "14px", border: "1px solid #e2e8f0", padding: "2rem", boxShadow: "0 4px 12px rgba(0,0,0,0.03)" }}>
                {errorMessage && (
                  <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "8px", padding: "0.85rem 1rem", color: "#991b1b", fontSize: "0.9rem", marginBottom: "1.5rem" }}>
                    ⚠️ {errorMessage}
                  </div>
                )}

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.25rem", marginBottom: "1.5rem" }}>
                  {/* Name */}
                  <div>
                    <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, marginBottom: "0.35rem", color: "#334155" }}>
                      Worker Full Name <span style={{ color: "#ef4444" }}>*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Ramesh Chandra Das"
                      style={{ width: "100%", padding: "0.65rem 0.85rem", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.95rem", outline: "none", boxSizing: "border-box" }}
                    />
                  </div>

                  {/* Primary Mobile */}
                  <div>
                    <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, marginBottom: "0.35rem", color: "#334155" }}>
                      Primary Mobile Number (Calling / SMS) <span style={{ color: "#ef4444" }}>*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="10-digit mobile number"
                      maxLength={10}
                      style={{ width: "100%", padding: "0.65rem 0.85rem", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.95rem", outline: "none", boxSizing: "border-box" }}
                    />
                  </div>

                  {/* Alternate Phone */}
                  <div>
                    <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, marginBottom: "0.35rem", color: "#334155" }}>
                      WhatsApp / Alternative Phone (Optional)
                    </label>
                    <input
                      type="tel"
                      value={alternatePhone}
                      onChange={(e) => setAlternatePhone(e.target.value)}
                      placeholder="Alternative contact number"
                      maxLength={10}
                      style={{ width: "100%", padding: "0.65rem 0.85rem", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.95rem", outline: "none", boxSizing: "border-box" }}
                    />
                  </div>

                  {/* Primary Trade */}
                  <div>
                    <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, marginBottom: "0.35rem", color: "#334155" }}>
                      Primary Trade / Skill <span style={{ color: "#ef4444" }}>*</span>
                    </label>
                    <select
                      value={trade}
                      onChange={(e) => setTrade(e.target.value)}
                      style={{ width: "100%", padding: "0.65rem 0.85rem", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.95rem", outline: "none", background: "#fff", boxSizing: "border-box" }}
                    >
                      {TRADE_OPTIONS.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>

                  {/* Experience */}
                  <div>
                    <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, marginBottom: "0.35rem", color: "#334155" }}>
                      Experience in this Trade
                    </label>
                    <select
                      value={experience}
                      onChange={(e) => setExperience(e.target.value)}
                      style={{ width: "100%", padding: "0.65rem 0.85rem", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.95rem", outline: "none", background: "#fff", boxSizing: "border-box" }}
                    >
                      <option value="Less than 1 Year">Less than 1 Year</option>
                      <option value="1-2 Years">1-2 Years</option>
                      <option value="3-5 Years">3-5 Years</option>
                      <option value="5-10 Years">5-10 Years</option>
                      <option value="10+ Years">10+ Years (Senior Master)</option>
                    </select>
                  </div>

                  {/* Preferred Locality */}
                  <div>
                    <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, marginBottom: "0.35rem", color: "#334155" }}>
                      Primary Service Locality in Guwahati
                    </label>
                    <select
                      value={locality}
                      onChange={(e) => setLocality(e.target.value)}
                      style={{ width: "100%", padding: "0.65rem 0.85rem", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.95rem", outline: "none", background: "#fff", boxSizing: "border-box" }}
                    >
                      {GUWAHATI_LOCALITIES.map((loc) => (
                        <option key={loc} value={loc}>{loc}</option>
                      ))}
                    </select>
                  </div>

                  {/* Expected Daily Rate */}
                  <div>
                    <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, marginBottom: "0.35rem", color: "#334155" }}>
                      Expected Rate per Day / Visit (₹)
                    </label>
                    <input
                      type="number"
                      value={dailyRate}
                      onChange={(e) => setDailyRate(e.target.value)}
                      placeholder="e.g. 500 or 800"
                      style={{ width: "100%", padding: "0.65rem 0.85rem", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.95rem", outline: "none", boxSizing: "border-box" }}
                    />
                  </div>

                  {/* Aadhaar / ID Number */}
                  <div>
                    <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, marginBottom: "0.35rem", color: "#334155" }}>
                      Aadhaar / Voter ID Number (For Admin Verification)
                    </label>
                    <input
                      type="text"
                      value={aadhaarNumber}
                      onChange={(e) => setAadhaarNumber(e.target.value)}
                      placeholder="12-digit Aadhaar / ID proof"
                      style={{ width: "100%", padding: "0.65rem 0.85rem", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.95rem", outline: "none", boxSizing: "border-box" }}
                    />
                  </div>
                </div>

                {/* Full Address */}
                <div style={{ marginBottom: "1.25rem" }}>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, marginBottom: "0.35rem", color: "#334155" }}>
                    Home / Workshop Address in Guwahati
                  </label>
                  <textarea
                    rows={2}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="House / Room no, landmark, road name, area..."
                    style={{ width: "100%", padding: "0.65rem 0.85rem", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.95rem", outline: "none", boxSizing: "border-box" }}
                  />
                </div>

                {/* Emergency Contact */}
                <div style={{ marginBottom: "1.25rem" }}>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, marginBottom: "0.35rem", color: "#334155" }}>
                    Emergency Contact Name &amp; Phone (Family / Relative)
                  </label>
                  <input
                    type="text"
                    value={emergencyContact}
                    onChange={(e) => setEmergencyContact(e.target.value)}
                    placeholder="e.g. Brother: Subhash Das - 9876543210"
                    style={{ width: "100%", padding: "0.65rem 0.85rem", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.95rem", outline: "none", boxSizing: "border-box" }}
                  />
                </div>

                {/* Skills description */}
                <div style={{ marginBottom: "1.5rem" }}>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, marginBottom: "0.35rem", color: "#334155" }}>
                    Specific Skills / Tool Experience
                  </label>
                  <input
                    type="text"
                    value={skills}
                    onChange={(e) => setSkills(e.target.value)}
                    placeholder="e.g. Inverter battery wiring, MCB distribution board, tile cutting, PPR pipe welding"
                    style={{ width: "100%", padding: "0.65rem 0.85rem", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.95rem", outline: "none", boxSizing: "border-box" }}
                  />
                </div>

                {/* Declaration Checkbox */}
                <div style={{ marginBottom: "1.75rem", background: "#f8fafc", padding: "1rem", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                  <label style={{ display: "flex", gap: "10px", alignItems: "start", fontSize: "0.85rem", color: "#475569", cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={agreed}
                      onChange={(e) => setAgreed(e.target.checked)}
                      style={{ marginTop: "2px", width: "16px", height: "16px" }}
                    />
                    <span>
                      I declare that all details provided are accurate. I understand that Marac Workers Admin will perform background and identity verification prior to activating my partner account for customer service dispatch.
                    </span>
                  </label>
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    width: "100%",
                    padding: "0.9rem",
                    borderRadius: "10px",
                    background: submitting ? "#94a3b8" : "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)",
                    color: "#ffffff",
                    border: "none",
                    fontSize: "1.05rem",
                    fontWeight: 800,
                    cursor: submitting ? "not-allowed" : "pointer",
                    boxShadow: "0 4px 12px rgba(2,132,199,0.25)",
                    transition: "transform 0.15s ease"
                  }}
                >
                  {submitting ? "Submitting Application..." : "Submit Registration for Admin Verification →"}
                </button>
              </form>
            )}
          </div>
        )}

        {/* Tab 2: Check Status */}
        {activeTab === "status" && (
          <div style={{ background: "#ffffff", borderRadius: "14px", border: "1px solid #e2e8f0", padding: "2rem", boxShadow: "0 4px 12px rgba(0,0,0,0.03)" }}>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 800, margin: "0 0 0.5rem 0", color: "#0f172a" }}>
              Check Worker Application Status
            </h2>
            <p style={{ color: "#64748b", fontSize: "0.9rem", margin: "0 0 1.5rem 0" }}>
              Enter your 10-digit mobile number or Application Reference Code (e.g. MW-WRK-...) to see your live verification state.
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleLookup(searchQuery);
              }}
              style={{ display: "flex", gap: "0.75rem", marginBottom: "1.5rem", flexWrap: "wrap" }}
            >
              <input
                type="text"
                required
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Mobile number or MW-WRK-..."
                style={{ flex: 1, minWidth: "220px", padding: "0.75rem 1rem", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.95rem", outline: "none" }}
              />
              <button
                type="submit"
                disabled={searchingStatus}
                style={{
                  padding: "0.75rem 1.5rem",
                  borderRadius: "8px",
                  background: "#0284c7",
                  color: "#ffffff",
                  border: "none",
                  fontWeight: 700,
                  fontSize: "0.95rem",
                  cursor: searchingStatus ? "not-allowed" : "pointer"
                }}
              >
                {searchingStatus ? "Searching..." : "Check Status"}
              </button>
            </form>

            {lookupError && (
              <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "8px", padding: "1rem", color: "#991b1b", fontSize: "0.9rem", marginBottom: "1.5rem" }}>
                ⚠️ {lookupError}
              </div>
            )}

            {lookupResult && (
              <div style={{ border: "1px solid #e2e8f0", borderRadius: "10px", padding: "1.5rem", background: "#f8fafc" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "1rem", flexWrap: "wrap", gap: "0.5rem" }}>
                  <div>
                    <h3 style={{ fontSize: "1.2rem", fontWeight: 800, margin: "0 0 0.25rem 0" }}>
                      {lookupResult.name}
                    </h3>
                    <div style={{ fontSize: "0.85rem", color: "#64748b" }}>
                      {lookupResult.role} • {lookupResult.locality || "Guwahati"}
                    </div>
                  </div>
                  <div>
                    {lookupResult.verificationStatus === "APPROVED" || lookupResult.isActive ? (
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "#dcfce7", color: "#15803d", fontWeight: 800, padding: "0.35rem 0.85rem", borderRadius: "20px", fontSize: "0.85rem" }}>
                        ✓ Verified &amp; Active
                      </span>
                    ) : lookupResult.verificationStatus === "REJECTED" ? (
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "#fee2e2", color: "#b91c1c", fontWeight: 800, padding: "0.35rem 0.85rem", borderRadius: "20px", fontSize: "0.85rem" }}>
                        ✕ Not Approved
                      </span>
                    ) : (
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "#fef3c7", color: "#b45309", fontWeight: 800, padding: "0.35rem 0.85rem", borderRadius: "20px", fontSize: "0.85rem" }}>
                        ⏳ Pending Admin Verification
                      </span>
                    )}
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "0.75rem", fontSize: "0.85rem", borderTop: "1px solid #e2e8f0", paddingTop: "1rem" }}>
                  <div>
                    <span style={{ color: "#64748b" }}>Application Code:</span>{" "}
                    <strong>{lookupResult.registrationCode || "MW-WRK-" + lookupResult.phone.slice(-4)}</strong>
                  </div>
                  <div>
                    <span style={{ color: "#64748b" }}>Registered Mobile:</span>{" "}
                    <strong>{lookupResult.phone}</strong>
                  </div>
                  <div>
                    <span style={{ color: "#64748b" }}>Experience:</span>{" "}
                    <strong>{lookupResult.experience || "3-5 Years"}</strong>
                  </div>
                  <div>
                    <span style={{ color: "#64748b" }}>Submitted Date:</span>{" "}
                    <strong>{lookupResult.createdAt ? new Date(lookupResult.createdAt).toLocaleDateString() : "Recent"}</strong>
                  </div>
                </div>

                {lookupResult.verificationNotes && (
                  <div style={{ marginTop: "1rem", padding: "0.75rem", background: "#ffffff", borderRadius: "6px", border: "1px solid #e2e8f0", fontSize: "0.85rem" }}>
                    <strong style={{ color: "#475569" }}>Admin Verification Note:</strong>{" "}
                    <span style={{ color: "#0f172a" }}>{lookupResult.verificationNotes}</span>
                  </div>
                )}

                {lookupResult.verificationStatus === "APPROVED" && (
                  <div style={{ marginTop: "1.25rem", padding: "1rem", background: "#dcfce7", borderRadius: "8px", color: "#14532d", fontSize: "0.9rem" }}>
                    🎉 <strong>Congratulations!</strong> Your partner account has been verified and activated by Admin. You are now eligible to receive customer job dispatches across your area.
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
