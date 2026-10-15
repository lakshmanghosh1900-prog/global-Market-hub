import { BracketStrip } from "@/components/bracket-strip";
import { Header } from "@/components/header";
import { MerchantNotes } from "@/components/merchant-notes";
import { ProductGrid } from "@/components/product-grid";
import { getProductsForBracket } from "@/lib/products";

export async function PriceBracketPage({ bracket }: { bracket: string }) {
  const products = await getProductsForBracket(bracket);
  const label = bracket.replace("under-", "Under ₹");

  return (
    <>
      <Header />
      <BracketStrip />
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
      <footer className="site-footer">
        <div className="shell">Global Market Hub · Prices and availability are synced from the merchant.</div>
      </footer>
    </>
  );
}
