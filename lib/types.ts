export type ListingProduct = {
  id: string;
  sku: string;
  slug: string;
  title: string;
  price: number;
  mrp: number | null;
  brand: string | null;
  image: string | null;
  gallery?: string[];
  description?: string | null;
  gtin?: string | null;
  affiliateUrl: string;
  merchant: string;
  inStock: boolean;
  lastSync: Date;
  category: string;
  /** Local fixtures are useful for UI review but are never eligible for clickouts. */
  isFixture?: boolean;
};
