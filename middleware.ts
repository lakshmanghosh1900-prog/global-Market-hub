import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const defaultCountry = (process.env.NEXT_PUBLIC_COUNTRY_DEFAULT ?? "in").toLowerCase();

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml" ||
    pathname.includes("sitemap.xml") ||
    pathname.startsWith("/out") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  if (pathname === "/") return NextResponse.next();
  if (pathname === "/in" || pathname.startsWith("/in/")) return NextResponse.next();

  const rewriteUrl = request.nextUrl.clone();
  rewriteUrl.pathname = `/${defaultCountry}${pathname.startsWith("/") ? pathname : `/${pathname}`}`;
  return NextResponse.rewrite(rewriteUrl);
}

export const config = {
  matcher: ["/:path*"],
};
