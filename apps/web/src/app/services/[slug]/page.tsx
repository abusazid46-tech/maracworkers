import Link from "next/link";
import type { Metadata } from "next";
import {
  businessAddress,
  businessName,
  businessPhone,
  findSeoService,
  seoServices,
  type SeoServiceSlug,
  serviceAreas,
  siteUrl
} from "@/components/seo-data";

type PageProps = {
  params: Promise<{ slug: string }>;
};

const serviceSeoHighlights: Record<SeoServiceSlug, string[]> = {
  "toilet-bath": [
    "Attached bathroom, toilet, tile, and fixture cleaning packages.",
    "Stain, odour, and hygiene-focused cleaning for Agartala homes.",
    "Single, double, and multi-bathroom options for families and rentals."
  ],
  "tank-wash": [
    "Overhead and underground tank cleaning support.",
    "Sludge removal, scrubbing, and bleaching treatment options.",
    "Useful for homes, apartments, shops, and small facilities in Agartala."
  ],
  "ac-repair": [
    "Foam jet AC service, installation, gas filling, and repair enquiries.",
    "Indoor and outdoor unit cleaning options for better cooling.",
    "Support for seasonal servicing before Agartala summer demand."
  ],
  "sofa-clean": [
    "Sofa, carpet, upholstery, and dining chair cleaning enquiries.",
    "Dry wash and deep cleaning options based on fabric condition.",
    "Good for homes, offices, rentals, and post-event cleanup."
  ],
  "deep-clean": [
    "2 BHK, 3 BHK, and full-house cleaning options.",
    "Designed for move-in, festival, tenant change, and deep hygiene needs.",
    "Room-wise cleaning scope can be confirmed before service."
  ],
  "kitchen-appliances": [
    "Kitchen chimney, fridge, microwave, gas stove, fan, and window cleaning.",
    "Appliance-focused add-ons for kitchens that need targeted cleanup.",
    "Flexible package selection for small kitchens and larger family homes."
  ],
  "aya-housemaid": [
    "Instant maid, one-time maid enquiry, baby care, and patient-care support.",
    "Best for households that need care or domestic help in Agartala.",
    "Duty timing and scope can be confirmed before assigning staff."
  ],
  "pest-control": [
    "Home and commercial pest control enquiries.",
    "Useful for kitchens, apartments, shops, and recurring pest issues.",
    "Treatment scope can be checked by pest type and property size."
  ],
  "painter-plumber": [
    "Painting, plumbing, carpenter, and small repair enquiries.",
    "Rate confirmation after site verification where required.",
    "Helpful for urgent fixes, renovation support, and maintenance visits."
  ],
  "saloon-spa": [
    "At-home salon, grooming, spa, and beauty service enquiries.",
    "Convenient booking support for customers in Agartala.",
    "Service availability can be confirmed by preferred date and treatment."
  ],
  security: [
    "Domestic, private, and corporate security guard enquiries.",
    "12-hour duty options can be confirmed by location and requirement.",
    "Facility manpower support for homes, offices, and commercial premises."
  ]
};

export const dynamicParams = false;

export function generateStaticParams() {
  return seoServices.map((service) => ({ slug: service.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const service = findSeoService(slug);
  if (!service) {
    return {
      title: "Home Services in Agartala",
      description: "Book The Wings Group for trusted home services in Agartala."
    };
  }

  return {
    title: service.title,
    description: service.description,
    keywords: [...service.keywords],
    alternates: {
      canonical: `/services/${service.slug}/`
    },
    openGraph: {
      title: `${service.title} | ${businessName}`,
      description: service.description,
      url: `${siteUrl}/services/${service.slug}/`,
      images: ["/favicon.png"]
    },
    twitter: {
      card: "summary_large_image",
      title: `${service.title} | ${businessName}`,
      description: service.description,
      images: ["/favicon.png"]
    }
  };
}

export default async function ServiceSeoPage({ params }: PageProps) {
  const { slug } = await params;
  const service = findSeoService(slug) ?? seoServices[0];
  const relatedServices = seoServices.filter((item) => item.slug !== service.slug).slice(0, 6);
  const highlights = serviceSeoHighlights[service.slug];

  const serviceSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: service.name,
    description: service.description,
    url: `${siteUrl}/services/${service.slug}/`,
    provider: {
      "@type": "LocalBusiness",
      name: businessName,
      telephone: businessPhone,
      url: siteUrl,
      address: {
        "@type": "PostalAddress",
        ...businessAddress
      }
    },
    areaServed: serviceAreas.map((area) => ({
      "@type": "Place",
      name: area
    })),
    serviceType: service.name
  };

  return (
    <main className="seo-page">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(serviceSchema).replace(/</g, "\\u003c")
        }}
      />
      <section className="seo-hero">
        <div className="container">
          <Link className="seo-logo-link" href="/">
            <img src="/the-wings-logo.png" alt={`${businessName} logo`} />
            <span>{businessName}</span>
          </Link>
          <div className="section-label">Agartala Home Services</div>
          <h1>{service.title}</h1>
          <p>{service.description}</p>
          <div className="seo-actions">
            <Link className="btn-secondary" href="/#services" style={{ padding: "0.8rem 2rem" }}>Book this service</Link>
            <a className="btn-outline" href="tel:+919365123456" style={{ padding: "0.8rem 2rem" }}>Call +91 93651 23456</a>
          </div>
        </div>
      </section>

      <section className="seo-content-section">
        <div className="container">
          <div className="seo-content-grid">
            <article>
              <h2>{service.name} by Marac Workers</h2>
              <p>
                Marac Workers provides verified {service.name.toLowerCase()} for customers in Guwahati and nearby areas with background-checked professionals,
                clear booking flow, local support, and flexible payment options.
              </p>
              <p>
                Service availability is focused on Guwahati and nearby localities including {serviceAreas.slice(1, 6).join(", ")}.
                For the fastest confirmation, book online or call the team directly.
              </p>
              <h3>Why choose Marac Workers for {service.name}?</h3>
              <ul>
                {highlights.map((highlight) => (
                  <li key={highlight}>{highlight}</li>
                ))}
              </ul>
            </article>
            <aside className="seo-contact-card">
              <h2>Book in Guwahati</h2>
              <p>{businessAddress.streetAddress}, {businessAddress.addressLocality}, {businessAddress.addressRegion}</p>
              <a href="tel:+919365123456">Call +91 93651 23456</a>
              <a href="https://wa.me/919365123456" target="_blank" rel="noreferrer">WhatsApp Marac Workers</a>
            </aside>
          </div>
        </div>
      </section>

      <section className="seo-related-section">
        <div className="container">
          <h2>More services in Agartala</h2>
          <div className="seo-related-grid">
            {relatedServices.map((item) => (
              <Link href={`/services/${item.slug}/`} key={item.slug}>
                <strong>{item.name}</strong>
                <span>{item.description}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
