import { CustomerHome } from "@/components/CustomerHome";
import {
  businessAddress,
  businessName,
  businessPhone,
  faqItems,
  seoServices,
  serviceAreas,
  siteUrl,
  whatsappUrl
} from "@/components/seo-data";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Marac Workers | Find Skilled Electricians, Plumbers, Painters & Workers Near You",
  description: "Book verified electricians, plumbers, carpenters, painters, AC technicians, cleaning staff, and skilled trade professionals instantly with Marac Workers.",
  alternates: {
    canonical: "/"
  },
  openGraph: {
    title: "Marac Workers | Find Skilled Workers Near You",
    description: "Book verified electricians, plumbers, carpenters, painters, AC technicians, cleaning staff, and skilled trade professionals instantly.",
    url: siteUrl
  }
};

export default function HomePage() {
  return (
    <>
      <StructuredData data={[localBusinessSchema, servicesSchema, faqSchema]} />
      <CustomerHome />
    </>
  );
}

function StructuredData({ data }: { data: unknown[] }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c")
      }}
    />
  );
}

const localBusinessSchema = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "@id": `${siteUrl}/#local-business`,
  name: businessName,
  url: siteUrl,
  logo: `${siteUrl}/favicon.png`,
  image: `${siteUrl}/favicon.png`,
  telephone: businessPhone,
  priceRange: "₹₹",
  description: "Skilled workers and home services platform for electricians, plumbers, carpenters, painters, AC repair, cleaning, and maintenance.",
  address: {
    "@type": "PostalAddress",
    ...businessAddress
  },
  geo: {
    "@type": "GeoCoordinates",
    latitude: 26.1445,
    longitude: 91.7362
  },
  areaServed: serviceAreas.map((area) => ({
    "@type": "Place",
    name: area
  })),
  contactPoint: [
    {
      "@type": "ContactPoint",
      telephone: businessPhone,
      contactType: "customer service",
      areaServed: "Guwahati",
      availableLanguage: ["English", "Hindi", "Assamese", "Bengali"]
    }
  ],
  sameAs: [whatsappUrl],
  openingHoursSpecification: [
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
      opens: "08:00",
      closes: "21:00"
    }
  ]
};

const servicesSchema = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  "@id": `${siteUrl}/#services`,
  name: "Skilled Worker Services in Guwahati",
  itemListElement: seoServices.map((service, index) => ({
    "@type": "ListItem",
    position: index + 1,
    item: {
      "@type": "Service",
      name: service.name,
      description: service.description,
      provider: {
        "@id": `${siteUrl}/#local-business`
      },
      areaServed: {
        "@type": "City",
        name: "Guwahati"
      },
      url: `${siteUrl}/services/${service.slug}/`
    }
  }))
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqItems.map((item) => ({
    "@type": "Question",
    name: item.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: item.answer
    }
  }))
};
