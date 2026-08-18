import type { Metadata } from "next";
import Link from "next/link";
import { businessName, businessPhone, siteUrl } from "@/components/seo-data";

export const metadata: Metadata = {
  title: "Terms and Conditions",
  description: "Terms and conditions for booking Marac Workers skilled services in Guwahati, Assam.",
  alternates: {
    canonical: "/terms/"
  }
};

export default function TermsPage() {
  return (
    <main className="seo-page">
      <section className="seo-hero" style={{ background: "var(--navy)", color: "white", padding: "4rem 0" }}>
        <div className="container">
          <Link className="logo" href="/" style={{ marginBottom: "1.5rem", display: "inline-flex" }}>
            <i className="fas fa-hard-hat" style={{ color: "var(--orange)" }} />
            <span style={{ color: "white" }}>MARAC</span>
            <span style={{ color: "var(--orange)" }}>WORKERS</span>
          </Link>
          <div style={{ color: "var(--orange)", fontWeight: 700, fontSize: "0.9rem", marginBottom: 6 }}>Booking Policy</div>
          <h1 style={{ fontSize: "2.8rem", fontWeight: 900, color: "white" }}>Terms & Conditions</h1>
          <p style={{ color: "#b6c7dd" }}>These terms apply to service bookings and worker requests made with Marac Workers.</p>
        </div>
      </section>

      <section className="section container">
        <div style={{ display: "grid", gridTemplateColumns: "1.3fr 0.7fr", gap: "3rem" }}>
          <article style={{ color: "var(--text-main)", lineHeight: 1.8 }}>
            <h2 style={{ fontSize: "1.5rem", fontWeight: 800, marginBottom: "0.8rem", color: "var(--navy)" }}>1. Service Booking & Matching</h2>
            <p style={{ color: "var(--text-muted)", marginBottom: "1.5rem" }}>
              Marac Workers facilitates connections between customers and verified independent skilled trade professionals (electricians, plumbers, carpenters, painters, AC technicians, cleaning staff, and daily laborers). Work dispatch times depend on worker availability, location, and job requirements.
            </p>

            <h2 style={{ fontSize: "1.5rem", fontWeight: 800, marginBottom: "0.8rem", color: "var(--navy)" }}>2. Pricing and Payment</h2>
            <p style={{ color: "var(--text-muted)", marginBottom: "1.5rem" }}>
              Prices shown on the platform represent standard labor or package rates. Additional materials, spare parts, or custom job scopes will be estimated transparently by the technician before starting. Cash on delivery / pay after service completion is accepted, as well as secure online payments via Razorpay.
            </p>

            <h2 style={{ fontSize: "1.5rem", fontWeight: 800, marginBottom: "0.8rem", color: "var(--navy)" }}>3. Customer Responsibilities</h2>
            <p style={{ color: "var(--text-muted)", marginBottom: "1.5rem" }}>
              Customers must provide accurate contact details, service location, and a safe working environment for the technician. Any pre-existing damage or specialized requirements should be communicated in advance.
            </p>

            <h2 style={{ fontSize: "1.5rem", fontWeight: 800, marginBottom: "0.8rem", color: "var(--navy)" }}>4. Cancellation & Support</h2>
            <p style={{ color: "var(--text-muted)", marginBottom: "1.5rem" }}>
              Customers can reschedule or cancel a booking at any time before the technician arrives at the service location with zero penalty.
            </p>
          </article>

          <aside style={{ background: "var(--bg-alt)", padding: "2rem", borderRadius: "28px", border: "1px solid var(--border-card)", height: "fit-content" }}>
            <h3 style={{ fontSize: "1.3rem", fontWeight: 800, color: "var(--navy)", marginBottom: "0.6rem" }}>Need Help?</h3>
            <p style={{ color: "var(--text-muted)", fontSize: "0.95rem", marginBottom: "1.5rem" }}>
              Have questions about service coverage or booking policies? Contact our support team.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem" }}>
              <a className="btn-secondary" href={`tel:${businessPhone}`} style={{ justifyContent: "center" }}>
                <i className="fas fa-phone-alt" /> Call Support
              </a>
              <a className="btn-outline" href="https://wa.me/919365123456" target="_blank" rel="noreferrer" style={{ justifyContent: "center" }}>
                <i className="fab fa-whatsapp" /> WhatsApp Support
              </a>
              <Link className="btn-outline" href="/" style={{ justifyContent: "center" }}>
                Back to Home
              </Link>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
