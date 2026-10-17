import type { Metadata } from "next";
import { Header } from "@/components/header";
import { LoginForm } from "@/components/login-form";
import { isActiveCountry } from "@/lib/catalog-config";
import { notFound } from "next/navigation";

export const metadata: Metadata = { title: "Sign in | Global Market Hub", description: "Sign in with a secure email OTP to merge your saved shopping state." };

export default async function LoginPage({ params }: { params: Promise<{ country: string }> }) {
  const { country } = await params;
  if (!isActiveCountry(country)) notFound();
  return <><Header /><main className="shell listing-main auth-main"><LoginForm /></main></>;
}
