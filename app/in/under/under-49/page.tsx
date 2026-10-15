import type { Metadata } from "next";
import { PriceBracketPage } from "@/components/price-bracket-page";

export const revalidate = 60 * 60;

export const metadata: Metadata = {
  title: "Under ₹49 | Global Market Hub",
  description: "Fresh Flipkart finds priced under ₹49.",
};

export default function Under49Page() {
  return <PriceBracketPage bracket="under-49" />;
}
