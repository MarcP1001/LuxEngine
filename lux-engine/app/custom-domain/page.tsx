"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "convex/react";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { api } from "../../convex/_generated/api";
import Link from "next/link";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export default function CustomDomainPage() {
  return (
    <Suspense fallback={<Loading />}>
      <ConvexProvider client={convex}>
        <DomainResolver />
      </ConvexProvider>
    </Suspense>
  );
}

function DomainResolver() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const domain = searchParams.get("domain") ?? "";

  const site = useQuery(api.sites.getSiteByCustomDomain, { domain });

  useEffect(() => {
    if (site) {
      router.replace(`/sites/${site.subdomain}?_lux_custom=1`);
    }
  }, [router, site]);

  if (site === undefined) return <Loading />;

  if (!site) {
    return (
      <div className="min-h-screen bg-obsidian-deep flex flex-col items-center justify-center gap-6 text-center px-8">
        <p className="text-gunmetal text-[9px] tracking-[0.5em] uppercase">Domain Not Configured</p>
        <h1
          style={{ fontFamily: "var(--font-playfair)" }}
          className="text-white text-3xl font-normal"
        >
          {domain || "Unknown domain"}
        </h1>
        <p className="text-gunmetal text-sm max-w-md">
          This domain is not connected to a Lux Engine property site.
          If you own this domain, connect it in your Lux Engine dashboard under Settings.
        </p>
        <Link
          href="/"
          className="border border-sulfur/40 text-sulfur text-[9px] tracking-[0.35em] uppercase px-6 py-2.5 hover:bg-sulfur hover:text-obsidian transition-all duration-300"
        >
          Go to Lux Engine
        </Link>
      </div>
    );
  }

  return <Loading />;
}

function Loading() {
  return (
    <div className="min-h-screen bg-obsidian-deep flex items-center justify-center">
      <div className="w-10 h-10 border border-surface-border border-t-sulfur/60 rounded-full animate-spin" />
    </div>
  );
}
