import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Domains that belong to the platform itself (not custom domains)
const PLATFORM_HOSTS = new Set([
  "localhost",
  "localhost:3000",
  "127.0.0.1",
  "127.0.0.1:3000",
  "[::1]",
  "luxengine.io",
  "www.luxengine.io",
  ...(process.env.LUXENGINE_PLATFORM_HOSTS ?? "")
    .split(",")
    .map((host) => host.trim().toLowerCase())
    .filter(Boolean),
]);

function isPlatformHost(host: string): boolean {
  const bare = host.split(":")[0];
  if (PLATFORM_HOSTS.has(host) || PLATFORM_HOSTS.has(bare)) return true;
  if (bare.endsWith(".vercel.app")) return true;
  if (bare.endsWith(".convex.cloud")) return true;
  return false;
}

export default clerkMiddleware(async (_auth, req) => {
  // Custom domain routing: if host isn't a platform host, rewrite to domain handler
  const host = req.headers.get("host") ?? "";
  if (!isPlatformHost(host)) {
    if (
      req.nextUrl.pathname.startsWith("/sites/") &&
      req.nextUrl.searchParams.get("_lux_custom") === "1"
    ) {
      return NextResponse.next();
    }

    const url = req.nextUrl.clone();
    url.pathname = "/custom-domain";
    url.searchParams.set("domain", host);
    return NextResponse.rewrite(url);
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
