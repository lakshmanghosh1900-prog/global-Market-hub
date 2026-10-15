export type ListingProduct = {
  id: string;
  sku: string;
  title: string;
  price: number;
  mrp: number | null;
  brand: string | null;
  image: string | null;
  affiliateUrl: string;
  merchant: string;
  inStock: boolean;
  lastSync: Date;
  category: string;
};
