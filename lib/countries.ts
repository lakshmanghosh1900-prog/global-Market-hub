import countrySource from "@/data/countries.json";

export type CountryMetadata = {
  code: string;
  name: string;
  active: boolean;
  currency: string;
  locale: string;
  launchStatus: "active" | "coming_soon";
  supportedMerchants: string[];
};

const countryDefaults: Record<string, { currency: string; locale: string }> = {
  in: { currency: "INR", locale: "en-IN" },
};

export const countryRegistry: CountryMetadata[] = countrySource.map((country) => {
  const defaults = countryDefaults[country.code] ?? { currency: "TBD", locale: `en-${country.code.toUpperCase()}` };
  return {
    ...country,
    ...defaults,
    launchStatus: country.active ? "active" : "coming_soon",
    supportedMerchants: country.active ? ["flipkart"] : [],
  };
});

export const defaultCountry = "in";

export function getCountry(code: string) {
  return countryRegistry.find((country) => country.code === code.toLowerCase());
}

export function getActiveCountries() {
  return countryRegistry.filter((country) => country.active);
}
