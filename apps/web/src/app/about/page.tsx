import { AboutContent } from "@/components/AboutContent";
import { businessName, siteUrl } from "@/components/seo-data";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: `About ${businessName} | Skilled Worker Network`,
  description: "Learn about Marac Workers, connecting verified electricians, plumbers, carpenters, painters, and trade professionals with households and businesses across Guwahati.",
  alternates: {
    canonical: "/about/"
  },
  openGraph: {
    title: `About ${businessName}`,
    description: "Connecting verified electricians, plumbers, carpenters, painters, and trade professionals across Guwahati.",
    url: `${siteUrl}/about/`
  }
};

export default function AboutPage() {
  return <AboutContent />;
}
