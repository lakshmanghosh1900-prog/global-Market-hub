import { notFound } from "next/navigation";
import { PriceBracketPage } from "@/components/price-bracket-page";

export const revalidate = 60 * 60;

export default function BracketPage({ params }: { params: { bracket: string } }) {
  if (!/^under-\d+$/.test(params.bracket)) {
    notFound();
  }

  return <PriceBracketPage bracket={params.bracket} />;
}
