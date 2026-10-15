import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Global Market Hub | India-first finds",
  description: "Freshly synced Flipkart finds under ₹49.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-IN">
      <body>{children}</body>
    </html>
  );
}
