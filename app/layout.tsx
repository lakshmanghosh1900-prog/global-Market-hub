import type { Metadata } from "next";
import { CommerceProvider } from "@/components/commerce-provider";
import { ChatWidget } from "@/components/chat-widget";
import { SiteFooter } from "@/components/site-footer";
import { siteUrl } from "@/lib/seo";
import "./globals.css";

export const metadata: Metadata = {
  title: `${process.env.BRAND_NAME || process.env.NEXT_PUBLIC_BRAND_NAME || "Global Market Hub"} | India-first finds`,
  description: "Freshly synced Flipkart finds under ₹49.",
  metadataBase: new URL(siteUrl()),
  manifest: "/manifest.webmanifest",
  icons: { icon: "/icons/icon.svg", apple: "/icons/icon.svg" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-IN">
      <body><CommerceProvider>{children}<SiteFooter /><ChatWidget /></CommerceProvider></body>
    </html>
  );
}
