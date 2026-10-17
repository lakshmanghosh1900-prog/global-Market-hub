import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { countryRegistry } from "@/lib/countries";

const defaultCountry = (process.env.NEXT_PUBLIC_COUNTRY_DEFAULT ?? "in").toLowerCase();

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml" ||
    pathname.includes("sitemap.xml") ||
    pathname.startsWith("/out") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/auth") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  let response = NextResponse.next({ request });
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (supabaseUrl && supabaseKey) {
    const supabase = createServerClient(supabaseUrl, supabaseKey, {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    });
    await supabase.auth.getUser();
  }

  if (pathname === "/") return response;
  if (pathname === "/in" || pathname.startsWith("/in/")) return response;

  const requestedCountry = pathname.split("/")[1]?.toLowerCase();
  const market = countryRegistry.find((item) => item.code === requestedCountry);
  if (market && !market.active) {
    if (pathname !== `/${market.code}`) {
      const previewUrl = request.nextUrl.clone();
      previewUrl.pathname = `/${market.code}`;
      const previewResponse = NextResponse.rewrite(previewUrl, { request });
      response.cookies.getAll().forEach((cookie) => previewResponse.cookies.set(cookie));
      return previewResponse;
    }
    return response;
  }

  const rewriteUrl = request.nextUrl.clone();
  rewriteUrl.pathname = `/${defaultCountry}${pathname.startsWith("/") ? pathname : `/${pathname}`}`;
  const rewritten = NextResponse.rewrite(rewriteUrl, { request });
  response.cookies.getAll().forEach((cookie) => rewritten.cookies.set(cookie));
  return rewritten;
}

export const config = {
  matcher: ["/:path*"],
};
