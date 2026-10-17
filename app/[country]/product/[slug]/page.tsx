import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Header } from "@/components/header";
import { ProductDetail } from "@/components/product-detail";
import { getProductBySlug, getProductOffers, searchProducts } from "@/lib/products";
import { isActiveCountry } from "@/lib/catalog-config";
import { siteUrl } from "@/lib/seo";

export const revalidate = 3600;

export async function generateMetadata({ params }: { params: Promise<{ country: string; slug: string }> }): Promise<Metadata> {
  const { country, slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Product not found | Global Market Hub" };
  return { title: `${product.title} | Global Market Hub`, description: `${product.title} from ${product.merchant}, freshly synced in INR.`, alternates: { canonical: `${siteUrl()}/${country}/product/${product.slug}` } };
}

export default async function ProductPage({ params }: { params: Promise<{ country: string; slug: string }> }) {
  const { country: rawCountry, slug } = await params;
  if (!isActiveCountry(rawCountry)) notFound();
  const product = await getProductBySlug(slug);
  if (!product) notFound();
  const offers = await getProductOffers(product);
  const related = (await searchProducts("", undefined, product.category)).filter((item) => item.id !== product.id).slice(0, 3);
  return <><Header country={rawCountry.toLowerCase()} /><ProductDetail product={product} offers={offers} related={related} country={rawCountry.toLowerCase()} /></>;
}
