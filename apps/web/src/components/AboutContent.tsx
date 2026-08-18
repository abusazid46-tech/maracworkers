import Link from "next/link";
import { SiteFooter } from "./CustomerHome";

export function AboutContent() {
  return (
    <>
      <nav className="navbar">
        <div className="container nav-flex">
          <Link className="logo" href="/">
            <i className="fas fa-hard-hat" />
            <span className="marac">MARAC</span>
            <span className="workers">WORKERS</span>
          </Link>
          <ul className="nav-links">
            <li><Link href="/#home">Home</Link></li>
            <li><Link href="/#services">Services</Link></li>
            <li><Link href="/#howitworks">How It Works</Link></li>
            <li><Link href="/about" className="active">About Us</Link></li>
            <li><Link href="/#contact">Contact</Link></li>
          </ul>
          <div className="nav-actions">
            <Link className="btn-secondary" href="/#services" style={{ padding: "0.55rem 1.6rem", fontSize: "0.92rem" }}>
              Book a Worker
            </Link>
          </div>
        </div>
      </nav>

      <section className="section" style={{ background: "var(--navy)", color: "white", padding: "4rem 0" }}>
        <div className="container">
          <div style={{ color: "var(--orange)", fontWeight: 700, fontSize: "0.9rem", marginBottom: "0.6rem" }}>
            👷 Northeast India&apos;s Trusted Skilled Worker Network
          </div>
          <h1 style={{ fontSize: "3rem", fontWeight: 900, letterSpacing: "-0.02em", color: "white" }}>
            About <span style={{ color: "var(--orange)" }}>Marac Workers</span>
          </h1>
          <p style={{ color: "#b6c7dd", maxWidth: "600px", fontSize: "1.1rem", marginTop: "0.8rem" }}>
            Connecting households and businesses with verified electricians, plumbers, carpenters, painters, and trade professionals.
          </p>
        </div>
      </section>

      <section className="section container">
        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: "3rem", alignItems: "start" }}>
          <div>
            <div style={{ color: "var(--orange)", fontWeight: 700, textTransform: "uppercase", fontSize: "0.85rem", letterSpacing: 1, marginBottom: 8 }}>
              Who We Are
            </div>
            <h2 className="section-title" style={{ textAlign: "left", marginBottom: "1.2rem" }}>
              Empowering Skilled Workers, <span style={{ color: "var(--orange)" }}>Delivering Reliability</span>
            </h2>
            <p style={{ color: "var(--text-muted)", lineHeight: 1.8, fontSize: "1.05rem", marginBottom: "1rem" }}>
              Marac Workers is on a mission to organize the skilled trade economy across Northeast India. We connect customers who need urgent or scheduled repairs directly with background-checked, trained, and verified professionals.
            </p>
            <p style={{ color: "var(--text-muted)", lineHeight: 1.8, fontSize: "1.05rem", marginBottom: "1.5rem" }}>
              From transparent pricing to cash-on-delivery and instant job dispatch, we make home maintenance effortless while providing skilled laborers and technicians with steady opportunities and higher income.
            </p>
            <div style={{ fontWeight: 800, marginBottom: "0.8rem", color: "var(--navy)" }}>Our Core Services</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.6rem" }}>
              {["Electricians & Wiring", "Plumbing & Leak Repairs", "Carpentry & Furniture", "Painting & Waterproofing", "AC Repair & Servicing", "Deep Home Cleaning"].map((service) => (
                <span key={service} style={{ background: "var(--orange-subtle)", color: "var(--navy)", padding: "0.4rem 1rem", borderRadius: "30px", fontWeight: 600, fontSize: "0.88rem" }}>
                  {service}
                </span>
              ))}
            </div>
          </div>

          <div style={{ background: "var(--bg-alt)", borderRadius: "36px", padding: "2.4rem 2rem", border: "1px solid var(--border-card)" }}>
            <div style={{ fontSize: "2.5rem", marginBottom: "0.8rem" }}>🏗️</div>
            <h3 style={{ fontSize: "1.4rem", fontWeight: 800, color: "var(--navy)", marginBottom: "0.4rem" }}>The Marac Promise</h3>
            <p style={{ color: "var(--text-muted)", fontSize: "0.95rem", lineHeight: 1.6, marginBottom: "1.5rem" }}>
              100% verified workers, upfront transparent pricing, and pay-after-service guarantee for every single booking.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div style={{ background: "white", padding: "1.2rem", borderRadius: "20px", textAlign: "center" }}>
                <div style={{ fontSize: "1.5rem", fontWeight: 900, color: "var(--orange)" }}>500+</div>
                <div style={{ fontSize: "0.82rem", color: "var(--text-muted)", fontWeight: 600 }}>Verified Workers</div>
              </div>
              <div style={{ background: "white", padding: "1.2rem", borderRadius: "20px", textAlign: "center" }}>
                <div style={{ fontSize: "1.5rem", fontWeight: 900, color: "var(--navy)" }}>4.8★</div>
                <div style={{ fontSize: "0.82rem", color: "var(--text-muted)", fontWeight: 600 }}>Average Rating</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </>
  );
}
