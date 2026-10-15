import { redirect } from "next/navigation";
import { isActiveCountry } from "@/lib/catalog-config";

export default function CountryHomePage({ params }: { params: { country: string } }) {
  if (!isActiveCountry(params.country)) redirect("/in/under/under-49");
  redirect(`/${params.country.toLowerCase()}/under/under-49`);
}
