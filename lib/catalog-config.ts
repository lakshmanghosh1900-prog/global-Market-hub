import { countryRegistry, defaultCountry, getCountry } from "@/lib/countries";

export { countryRegistry };
export const activeCountries = countryRegistry.filter((country) => country.active);
export const configuredDefaultCountry = (process.env.NEXT_PUBLIC_COUNTRY_DEFAULT ?? defaultCountry).toLowerCase();
export const isActiveCountry = (country: string) =>
  activeCountries.some((item) => item.code === country.toLowerCase());
export const getCountryMetadata = (country: string) => getCountry(country);
