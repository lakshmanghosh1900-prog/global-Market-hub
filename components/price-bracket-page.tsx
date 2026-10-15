import { BracketStrip } from "@/components/bracket-strip";
import { Header } from "@/components/header";
import { MerchantNotes } from "@/components/merchant-notes";
import { ProductGrid } from "@/components/product-grid";
import { getProductsForBracket } from "@/lib/products";
import { SiteFooter } from "@/components/site-footer";

export async function PriceBracketPage({ bracket, country = "in" }: { bracket: string; country?: string }) {
  const products = await getProductsForBracket(bracket);
  const label = bracket.replace("under-", "Under ₹");

  return (
    <>
      <Header />
      <BracketStrip country={country} activeBracket={bracket} />
      <main className="shell listing-main">
        <section className="listing-hero">
          <div>
            <p className="eyebrow">Fresh from Flipkart</p>
            <h1>{label} finds</h1>
            <p className="listing-intro">
              Everyday picks under {label.replace("Under ", "")} with clear prices, merchant context, and a fresh sync timestamp.
            </p>
          </div>
          <div className="result-count">
            <strong>{products.length}</strong>
            <span>products</span>
          </div>
        </section>

        <ProductGrid products={products} />
        <MerchantNotes />
      </main>
      <SiteFooter />
    </>
  );
}
