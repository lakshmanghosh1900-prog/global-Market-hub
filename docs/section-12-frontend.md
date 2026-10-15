# Section 12: Frontend - Next.js 14 Country Routing, Cards, Listing, PDP, SEO

## 12.1 Next.js 14 Country Routing
- Structure: app/[country]/...
- Default: /in/*
- Middleware: detect country, rewrite to /in if no country
- Country switcher component: Shows plain India badge until second country active. When second country active, shows dropdown.

## 12.2 Header and Bracket Strip
- Header: logo, search, country switcher, categories
- Bracket strip: Under 49, Under 99, Under 199 etc. Horizontal scroll. Links to /in/under/under-49 etc.

## 12.3 Product Card
- Merchant badge (Flipkart, Amazon-curated, Cuelinks merchant)
- Freshness label: "Updated 2h ago" from lastSync
- Price in INR, MRP strike, discount %
- Image, title, inStock
- Clickout: /out?url=affiliate_url (logs click, redirects with tracking ID)

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
- Until second country active: show plain badge "IN - India"
- When second country active: dropdown with IN, AE etc.
