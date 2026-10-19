# Section 12: Frontend - Next.js 15 Country Routing, Cards, Listing, PDP, SEO

## 12.1 Next.js 15 Country Routing
- Structure: app/[country]/...
- Default: /in/*
- Middleware: detect country, rewrite to /in if no country
- Country switcher component: Reads the 38-country registry, shows India as active, labels other markets as coming soon, and preserves inactive-market preview routing.

## 12.2 Header and Bracket Strip
- Header: logo, search, country switcher, categories
- Bracket strip: Under 49, Under 99, Under 199 etc. Horizontal scroll. Links to /in/under/under-49 etc.

## 12.3 Product Card
- Merchant badge (Flipkart, Amazon-curated, Cuelinks merchant)
- Freshness label derived from `lastSync`; preview fixtures are explicitly disclosed
- Price in INR, MRP strike, discount %
- Image, title, inStock
- Clickout: the browser submits an authoritative product ID to the server token route. The server validates the stored exact merchant URL, signs a short-lived `/out` token, logs a click, and applies merchant tracking. Fixtures, generic homepages, invalid hosts and missing HMAC are rejected.

## 12.4 Shared Listing Pages
- /in/under/[bracket] e.g. under-49, under-99
- /in/c/[category] e.g. electronics, fashion
- /in/hubs/[hub] e.g. deals, new-arrivals
- All use same ProductGrid component, filter by category/bracket

## 12.5 Section 12.9 - NOW BUILT (Was Pending)

### Product Detail Page (PDP) /in/product/[slug]
- Gallery, title, brand, rating placeholder (no reviews from Amazon Creators)
- Price block: current price, MRP, discount, merchant offers list (cheapest first)
- Freshness, inStock, GTIN
- Affiliate CTA: Buy on Flipkart (with tracking ID)
- Related products by category

### JSON-LD
- Product JSON-LD: name, image, brand, offers (price, currency INR, availability)
- BreadcrumbList JSON-LD
- Organization JSON-LD with legal entity and grievance officer (from env)

Example:
```json
{
  "@type": "Product",
  "name": "...",
  "offers": { "@type": "Offer", "priceCurrency": "INR", "price": "49", "availability": "InStock" }
}
```

### Sitemaps
- /sitemap.xml -> index to /in/sitemap.xml etc.
- /in/sitemap.xml -> products, categories, brackets, hubs
- /robots.txt -> Sitemap: https://yourdomain.com/sitemap.xml
- Generate via Next.js app/sitemap.ts

## 12.6 Country Switcher Logic
- Country selector always reads the registry. India is selectable and active; AE and all other inactive countries are selectable as clearly labelled coming-soon previews only.

## 12.7 Affiliate Wishlist Cart

- `lib/cart-storage.ts` owns the `global_market_cart` browser key, active-item reads, 30-day expiry cleanup, add/remove/clear methods, and the 50-item limit.
- `components/commerce-provider.tsx` keeps cart state available to the header, product actions, account merge flow, and drawer. A signed-in merge sends product IDs to the server and clears the local snapshot only after a successful merge.
- `components/cart/WishlistCartDrawer.tsx` is a responsive right-side slide-over. It shows thumbnails, localized INR prices, merchant badges, freshness/stock, remove actions, Clear All, the affiliate discovery disclaimer, and individual `Buy on [Merchant] →` buttons.
- The header trigger is `components/cart/CartHeaderTrigger.tsx` and includes an animated count badge. Merchant actions obtain a short-lived signed token from `/api/v1/redirect/token` and navigate through `/out`; there is intentionally no payment or direct checkout path.
- Prisma `Cart` rows expire after 30 days and can carry both `anonymousId` and a future authenticated `userId`. `CartItem` is a merchant/product snapshot with cascade deletion from its parent cart and a unique product per cart.

## 12.8 Future Best Offer Notification System

- `components/alerts/OfferAlertForm.tsx` is mounted below `/in/wishlist` at `#deal-alerts`. It collects email, optional phone, optional WhatsApp opt-in/number, category tags, deal brackets, and the mandatory DPDP consent statement.
- Submission is validated in the client and again by `POST /api/alerts/subscribe`. The API upserts by normalized email, records `consentAt`, records `whatsappConsentAt` only for an explicit WhatsApp opt-in, creates a verification token, and logs the mock verification URL for the demo.
- `GET /api/alerts/verify?token=...` sets `isVerified=true` and `isActive=true`; `GET /api/alerts/unsubscribe?email=...` sets `isActive=false` without deleting the subscription.
- The success confirmation is a responsive modal. Production email/WhatsApp delivery is intentionally not claimed until a compliant provider and sender are configured.
