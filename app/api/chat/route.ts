import { NextResponse } from "next/server";
import { searchProducts } from "@/lib/products";

const clean = (message: string) => message.replace(/[<>]/g, "").trim().slice(0, 500);

export async function POST(request: Request) {
  let body: { message?: unknown };
  try {
    body = (await request.json()) as { message?: unknown };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (typeof body.message !== "string" || !body.message.trim()) {
    return NextResponse.json({ error: "Message is required" }, { status: 400 });
  }

  const message = clean(body.message);
  if (message.length < 1) return NextResponse.json({ error: "Message is required" }, { status: 400 });

  const bracketMatch = message.match(/under[^0-9]{0,10}(49|99|199|499)/i);
  const bracket = bracketMatch ? `under-${bracketMatch[1]}` : undefined;
  const products = await searchProducts(bracket ? "" : message, bracket);
  const answer = products.length > 0
    ? `I found ${products.length} ${bracket ? `products ${bracket.replace("under-", "under ₹")}` : "matching products"}. Browse the results or tap View Offer to visit the merchant. Affiliate redirects may include tracking parameters; Global Market Hub does not take payment.`
    : "I can help you browse Flipkart finds, price brackets, and categories. Try asking for products under ₹49. Affiliate redirects send you to the merchant; we do not process payment. For grievances, contact the grievance officer listed in the site footer.";

  return NextResponse.json({ answer, fallback: true, products: products.slice(0, 6).map((product) => ({ slug: product.slug, title: product.title, price: product.price })) });
}
