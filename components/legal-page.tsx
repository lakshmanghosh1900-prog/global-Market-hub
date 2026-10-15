import type { ReactNode } from "react";
import { Header } from "@/components/header";

export function LegalPage({ eyebrow, title, children }: { eyebrow: string; title: string; children: ReactNode }) {
  return <><Header /><main className="shell legal-main"><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><div className="legal-copy">{children}</div></main></>;
}

export const brandName = () => process.env.BRAND_NAME || process.env.NEXT_PUBLIC_BRAND_NAME || "Global Market Hub";
export const legalEntity = () => process.env.LEGAL_ENTITY_NAME || "Legal entity details pending production configuration";
export const grievance = () => ({ name: process.env.GRIEVANCE_OFFICER_NAME || "Grievance officer details pending", email: process.env.GRIEVANCE_OFFICER_EMAIL || "grievance@example.com", address: process.env.GRIEVANCE_OFFICER_ADDRESS || "Address pending" });
