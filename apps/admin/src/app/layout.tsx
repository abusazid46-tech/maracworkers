import "./styles.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Marac Workers Admin CRM",
  description: "Admin CRM, bookings, and worker operations dashboard for Marac Workers.",
  robots: {
    index: false,
    follow: false
  },
  icons: {
    icon: "/favicon.png",
    shortcut: "/favicon.png",
    apple: "/favicon.png"
  }
};

export default function AdminLayout({ children }: { children?: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
