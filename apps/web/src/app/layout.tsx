import "./globals.css";
import "./site.css";
import type { Metadata } from "next";
import { businessName, siteUrl } from "@/components/seo-data";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${businessName} | Find Skilled Workers Near You`,
    template: `%s | ${businessName}`
  },
  description: "Marac Workers connects you with verified electricians, plumbers, carpenters, painters, AC repair, cleaning, and skilled trade professionals instantly.",
  applicationName: businessName,
  keywords: [
    "Marac Workers",
    "skilled workers near me",
    "electrician Guwahati",
    "plumber Guwahati",
    "carpenter Guwahati",
    "painter Guwahati",
    "AC repair Guwahati",
    "cleaning services Guwahati",
    "construction labour Guwahati",
    "home services app"
  ],
  authors: [{ name: businessName }],
  creator: businessName,
  publisher: businessName,
  alternates: {
    canonical: "/"
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: siteUrl,
    siteName: businessName,
    title: `${businessName} | Find Skilled Workers Near You`,
    description: "Connect with verified electricians, plumbers, carpenters, painters, cleaning, and skilled trade professionals instantly.",
    images: [
      {
        url: "/favicon.png",
        width: 512,
        height: 512,
        alt: `${businessName} logo`
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: `${businessName} | Find Skilled Workers Near You`,
    description: "Connect with verified electricians, plumbers, carpenters, painters, cleaning, and skilled trade professionals instantly.",
    images: ["/favicon.png"]
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1
    }
  },
  category: "Home Services & Skilled Workers",
  icons: {
    icon: "/favicon.png",
    shortcut: "/favicon.png",
    apple: "/favicon.png"
  },
  manifest: "/site.webmanifest",
  other: {
    "geo.region": "IN-AS",
    "geo.placename": "Guwahati",
    "geo.position": "26.1445;91.7362",
    ICBM: "26.1445, 91.7362"
  }
};

export default function RootLayout({ children }: { children?: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,400;14..32,500;14..32,600;14..32,700;14..32,800;14..32,900&display=swap"
          rel="stylesheet"
        />
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css"
          integrity="sha512-DTOQO9RWCH3ppGqcWaEA1BIZOC6xxalwEsw9c2QQeAIftl+Vegovlnee1c9QX4TctnWMn13TZye+giMm8e2LwA=="
          crossOrigin="anonymous"
          referrerPolicy="no-referrer"
        />
        <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  );
}
