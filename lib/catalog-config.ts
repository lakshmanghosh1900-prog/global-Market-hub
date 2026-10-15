import countries from "@/data/countries.json";

export const activeCountries = countries.filter((country) => country.active);
export const defaultCountry = (process.env.NEXT_PUBLIC_COUNTRY_DEFAULT ?? "in").toLowerCase();
export const isActiveCountry = (country: string) =>
  activeCountries.some((item) => item.code === country.toLowerCase());
