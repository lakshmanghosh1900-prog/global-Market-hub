import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Header } from "@/components/header";
import { ProductDetail } from "@/components/product-detail";
import { getProductBySlug, searchProducts } from "@/lib/products";
import { isActiveCountry } from "@/lib/catalog-config";

export const revalidate = 60 * 60;

export async function generateMetadata({ params }: { params: { country: string; slug: string } }): Promise<Metadata> {
  const product = await getProductBySlug(params.slug);
  if (!product) return { title: "Product not found | Global Market Hub" };
  return { title: `${product.title} | Global Market Hub`, description: `${product.title} from ${product.merchant}, freshly synced in INR.`, alternates: { canonical: `/${params.country}/product/${product.slug}` } };
}

export default async function ProductPage({ params }: { params: { country: string; slug: string } }) {
  if (!isActiveCountry(params.country)) notFound();
  const product = await getProductBySlug(params.slug);
  if (!product) notFound();
  const related = (await searchProducts("", undefined, product.category)).filter((item) => item.id !== product.id).slice(0, 3);
  return <><Header /><ProductDetail product={product} related={related} country={params.country.toLowerCase()} /></>;
}
