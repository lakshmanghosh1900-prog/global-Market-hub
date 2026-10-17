export const siteUrl = () => {
  const configured = process.env.NEXT_PUBLIC_BASE_URL?.trim();
  if (configured) return configured.replace(/\/$/, "");
  return process.env.NODE_ENV === "production" ? "https://global-market-hub.invalid" : "http://localhost:3000";
};

export const organizationJsonLd = () => ({
  "@context": "https://schema.org",
  "@type": "Organization",
  name: process.env.NEXT_PUBLIC_BRAND_NAME || "Global Market Hub",
  legalName: process.env.LEGAL_ENTITY_NAME || "Global Market Hub legal entity pending",
  url: siteUrl(),
  contactPoint: {
    "@type": "ContactPoint",
    contactType: "customer support",
    name: process.env.GRIEVANCE_OFFICER_NAME || "Grievance officer pending",
    email: process.env.GRIEVANCE_OFFICER_EMAIL || "grievance@example.com",
  },
  address: process.env.GRIEVANCE_OFFICER_ADDRESS || "Address pending",
});

export const safeJsonLd = (value: unknown) =>
  JSON.stringify(value).replace(/</g, "\\u003c").replace(/>/g, "\\u003e").replace(/&/g, "\\u0026");
