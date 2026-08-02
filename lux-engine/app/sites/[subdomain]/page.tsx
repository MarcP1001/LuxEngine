"use client";

import { use, useState, useEffect, useRef, useCallback } from "react";
import { useQuery, useMutation } from "convex/react";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { useAuth } from "@clerk/nextjs";
import { Id } from "../../../convex/_generated/dataModel";
import Link from "next/link";
import { api } from "../../../convex/_generated/api";
import IDXFooter from "@/components/IDXFooter";
import { useGenerateFlyer } from "@/components/FlyerGenerator";
import { useGenerateSocialPreview } from "@/components/SocialPreview";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

/* ─── Param unwrap wrapper ──────────────────────────────────── */

export default function SubdomainPage({
  params,
}: {
  params: Promise<{ subdomain: string }>;
}) {
  const { subdomain } = use(params);
  return (
    <ConvexProvider client={convex}>
      <PropertySitePage subdomain={subdomain} />
    </ConvexProvider>
  );
}

/* ─── Inner page (reads Convex) ─────────────────────────────── */

function PropertySitePage({ subdomain }: { subdomain: string }) {
  const site = useQuery(api.sites.getSiteBySubdomain, { subdomain });
  const listing = useQuery(
    api.listings.getPublicBySiteId,
    site?._id ? { siteId: site._id } : "skip",
  );

  if (site === undefined || (site && listing === undefined)) {
    return <LoadingSkeleton />;
  }

  if (site === null || listing === null || listing === undefined) {
    return <SiteNotFound />;
  }

  return (
    <PropertyPage
      listing={listing}
      activeNarrative={site.activeNarrative ?? "romantic"}
      siteId={site._id}
      subdomain={subdomain}
      ownerClerkId={site.clerkId}
    />
  );
}

/* ─── Full property page ────────────────────────────────────── */

type Listing = {
  address: string;
  city: string;
  state: string;
  zip: string;
  price: number;
  beds?: number;
  baths?: number;
  sqFt?: number;
  yearBuilt?: number;
  propType?: string;
  status: string;
  mlsName?: string;
  listingId: string;
  listingOfficeName?: string;
  agentId?: string;
  images: string[];
  aiRomantic?: string;
  aiInvestor?: string;
  aiFamily?: string;
};

function PropertyPage({
  listing,
  activeNarrative,
  siteId,
  subdomain,
  ownerClerkId,
}: {
  listing: Listing;
  activeNarrative: string;
  siteId: Id<"sites">;
  subdomain: string;
  ownerClerkId?: string;
}) {
  const validInitial = (["romantic", "investor", "family"] as const).includes(
    activeNarrative as "romantic" | "investor" | "family",
  )
    ? (activeNarrative as "romantic" | "investor" | "family")
    : "romantic";

  const [narrative, setNarrative] = useState<
    "romantic" | "investor" | "family"
  >(validInitial);
  const [navStuck, setNavStuck] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  const contactRef = useRef<HTMLDivElement>(null);
  const generateFlyer = useGenerateFlyer();
  const { generate: generateSocial, generating: generatingSocial } =
    useGenerateSocialPreview();

  useEffect(() => {
    const sentinel = document.getElementById("nav-sentinel");
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      ([entry]) => setNavStuck(!entry.isIntersecting),
      { threshold: 0 },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  // Keyboard handler for lightbox
  useEffect(() => {
    if (lightboxIdx === null) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setLightboxIdx(null);
      if (e.key === "ArrowRight")
        setLightboxIdx((i) =>
          i !== null ? Math.min(i + 1, listing.images.length - 1) : null,
        );
      if (e.key === "ArrowLeft")
        setLightboxIdx((i) => (i !== null ? Math.max(i - 1, 0) : null));
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [lightboxIdx, listing.images.length]);

  const fmt = (n: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(n);

  const narrativeText =
    narrative === "romantic"
      ? listing.aiRomantic
      : narrative === "investor"
        ? listing.aiInvestor
        : listing.aiFamily;

  const NARRATIVE_LABELS: Record<string, string> = {
    romantic: "Romantic",
    investor: "Investor",
    family: "Family",
  };

  const flyerData = {
    address: listing.address,
    city: listing.city,
    state: listing.state,
    zip: listing.zip,
    price: listing.price,
    beds: listing.beds,
    baths: listing.baths,
    sqFt: listing.sqFt,
    heroImage: listing.images[0],
    subdomain,
    narrative:
      narrative === "romantic"
        ? listing.aiRomantic
        : narrative === "investor"
          ? listing.aiInvestor
          : listing.aiFamily,
    listingOfficeName: listing.listingOfficeName,
    mlsName: listing.mlsName,
    agentId: listing.agentId,
  };

  const socialData = {
    address: listing.address,
    city: listing.city,
    state: listing.state,
    zip: listing.zip,
    price: listing.price,
    beds: listing.beds,
    baths: listing.baths,
    sqFt: listing.sqFt,
    heroImage: listing.images[0],
    narrative: narrativeText,
    subdomain,
  };

  return (
    <div className="min-h-screen bg-obsidian-deep text-white">
      {/* Top bar */}
      <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 md:px-8 h-14 bg-obsidian-deep/80 backdrop-blur border-b border-surface-border/50">
        <Link
          href="/"
          style={{
            fontFamily: "var(--font-playfair)",
            letterSpacing: "0.25em",
          }}
          className="text-sulfur text-base font-medium uppercase hover:text-sulfur/80 transition-colors"
        >
          Lux Engine
        </Link>
        <div className="hidden md:flex items-center gap-4">
          <button
            onClick={() =>
              contactRef.current?.scrollIntoView({ behavior: "smooth" })
            }
            className="border border-cinnabar text-cinnabar text-[9px] tracking-[0.35em] uppercase px-5 py-2 hover:bg-cinnabar hover:text-white transition-all duration-300"
          >
            Schedule Tour
          </button>
          <Link
            href="/"
            className="border border-sulfur/30 text-sulfur text-[9px] tracking-[0.35em] uppercase px-5 py-2 hover:bg-sulfur hover:text-obsidian transition-all duration-300"
          >
            List Your Home
          </Link>
        </div>
        {/* Mobile hamburger */}
        <button
          className="md:hidden flex flex-col gap-1 p-2"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Menu"
        >
          <span
            className={`block w-5 h-px bg-white transition-transform duration-200 ${mobileMenuOpen ? "rotate-45 translate-y-[3px]" : ""}`}
          />
          <span
            className={`block w-5 h-px bg-white transition-opacity duration-200 ${mobileMenuOpen ? "opacity-0" : ""}`}
          />
          <span
            className={`block w-5 h-px bg-white transition-transform duration-200 ${mobileMenuOpen ? "-rotate-45 -translate-y-[3px]" : ""}`}
          />
        </button>
      </div>

      {/* Mobile menu dropdown */}
      {mobileMenuOpen && (
        <div className="fixed top-14 left-0 right-0 z-40 bg-obsidian-deep/95 backdrop-blur border-b border-surface-border md:hidden">
          <div className="flex flex-col p-4 gap-3">
            <button
              onClick={() => {
                contactRef.current?.scrollIntoView({ behavior: "smooth" });
                setMobileMenuOpen(false);
              }}
              className="w-full bg-cinnabar text-white py-3 text-[9px] tracking-[0.4em] uppercase"
            >
              Schedule Tour
            </button>
            <button
              onClick={() => generateFlyer(flyerData)}
              className="w-full border border-surface-border text-gunmetal py-3 text-[9px] tracking-[0.4em] uppercase"
            >
              Download Flyer
            </button>
            <button
              onClick={() => generateSocial(socialData)}
              disabled={generatingSocial}
              className="w-full border border-surface-border text-gunmetal py-3 text-[9px] tracking-[0.4em] uppercase disabled:opacity-50"
            >
              {generatingSocial ? "Generating..." : "Social Image"}
            </button>
          </div>
        </div>
      )}

      {/* Hero */}
      <section className="relative h-[70vh] md:h-screen w-full overflow-hidden">
        {listing.images[0] ? (
          <div
            className="absolute inset-0 bg-cover bg-center cursor-pointer"
            style={{ backgroundImage: `url(${listing.images[0]})` }}
            onClick={() => setLightboxIdx(0)}
          />
        ) : (
          <div className="absolute inset-0 bg-surface-raised" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-obsidian-deep via-obsidian-deep/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-obsidian-deep/60 via-transparent to-transparent" />

        {listing.propType && (
          <div className="absolute top-20 left-4 md:left-8">
            <span className="bg-obsidian-deep/70 border border-surface-border backdrop-blur text-gunmetal text-[9px] tracking-[0.4em] uppercase px-3 py-1.5">
              {listing.propType}
            </span>
          </div>
        )}

        <div className="absolute top-20 right-4 md:right-8">
          <span className="bg-sulfur text-obsidian text-[9px] tracking-[0.4em] uppercase px-3 py-1.5 font-semibold">
            {listing.status}
          </span>
        </div>

        {listing.images.length > 1 && (
          <button
            onClick={() => setLightboxIdx(0)}
            className="absolute bottom-20 right-4 md:right-8 bg-obsidian-deep/70 border border-surface-border backdrop-blur text-white text-[9px] tracking-[0.3em] uppercase px-4 py-2 hover:bg-obsidian-deep/90 transition-colors flex items-center gap-2"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" />
            </svg>
            {listing.images.length} Photos
          </button>
        )}

        <div className="absolute bottom-8 md:bottom-16 left-4 md:left-8 right-4 md:right-8 flex flex-col gap-3 md:gap-4 max-w-3xl">
          <div className="flex items-center gap-3">
            <div className="w-6 h-px bg-sulfur/60" />
            <p className="text-[9px] tracking-[0.5em] uppercase text-gunmetal">
              {listing.city} · {listing.state} {listing.zip}
            </p>
          </div>
          <h1
            style={{ fontFamily: "var(--font-playfair)" }}
            className="text-3xl md:text-6xl lg:text-7xl font-normal leading-tight text-white"
          >
            {listing.address}
          </h1>
          <p
            style={{ fontFamily: "var(--font-playfair)" }}
            className="text-sulfur text-3xl md:text-5xl font-light"
          >
            {fmt(listing.price)}
          </p>
          <div className="flex items-center gap-4 md:gap-6 pt-2">
            {[
              listing.beds ? { value: listing.beds, label: "Beds" } : null,
              listing.baths ? { value: listing.baths, label: "Baths" } : null,
              listing.sqFt
                ? { value: listing.sqFt.toLocaleString(), label: "Sq Ft" }
                : null,
              listing.yearBuilt
                ? { value: listing.yearBuilt, label: "Built" }
                : null,
            ]
              .filter(Boolean)
              .map(
                (s, i) =>
                  s && (
                    <div key={i} className="flex flex-col items-center gap-0.5">
                      <span className="text-white text-sm md:text-base font-medium tabular-nums">
                        {s.value}
                      </span>
                      <span className="text-gunmetal text-[8px] md:text-[9px] tracking-[0.3em] uppercase">
                        {s.label}
                      </span>
                    </div>
                  ),
              )}
          </div>
        </div>
      </section>

      <div id="nav-sentinel" />

      {/* Sticky narrative nav */}
      <div
        className={`sticky top-14 z-40 border-b border-surface-border transition-all duration-300 ${navStuck ? "bg-obsidian-deep/98 backdrop-blur shadow-2xl" : "bg-surface"}`}
      >
        <div className="max-w-6xl mx-auto px-4 md:px-8 h-14 flex items-center justify-between gap-2 md:gap-4">
          <p className="hidden lg:block text-gunmetal text-[10px] tracking-widest tabular-nums">
            {listing.beds && `${listing.beds} Bed  ·  `}
            {listing.baths && `${listing.baths} Bath  ·  `}
            {listing.sqFt && `${listing.sqFt.toLocaleString()} SF  ·  `}
            {fmt(listing.price)}
          </p>
          <div className="flex items-center gap-1 ml-auto">
            {(["romantic", "investor", "family"] as const).map((n) => (
              <button
                key={n}
                onClick={() => setNarrative(n)}
                className={`px-3 md:px-4 py-1.5 text-[8px] md:text-[9px] tracking-[0.2em] md:tracking-[0.3em] uppercase transition-all duration-200 ${narrative === n ? "text-obsidian bg-sulfur" : "text-gunmetal hover:text-white"}`}
              >
                {NARRATIVE_LABELS[n]}
              </button>
            ))}
          </div>
          <button
            onClick={() => generateFlyer(flyerData)}
            className="hidden md:block border border-surface-border text-gunmetal text-[9px] tracking-[0.35em] uppercase px-5 py-2 hover:border-gunmetal hover:text-white transition-all duration-300 flex-shrink-0"
          >
            Flyer
          </button>
          <button
            onClick={() => generateSocial(socialData)}
            disabled={generatingSocial}
            className="hidden md:block border border-surface-border text-gunmetal text-[9px] tracking-[0.35em] uppercase px-5 py-2 hover:border-gunmetal hover:text-white transition-all duration-300 flex-shrink-0 disabled:opacity-50"
          >
            {generatingSocial ? "..." : "Social"}
          </button>
          <button
            onClick={() =>
              contactRef.current?.scrollIntoView({ behavior: "smooth" })
            }
            className="hidden md:block border border-cinnabar text-cinnabar text-[9px] tracking-[0.35em] uppercase px-5 py-2 hover:bg-cinnabar hover:text-white transition-all duration-300 flex-shrink-0"
          >
            Schedule Tour
          </button>
        </div>
      </div>

      {/* Narrative */}
      <section className="max-w-6xl mx-auto px-4 md:px-8 py-12 md:py-20 grid grid-cols-1 lg:grid-cols-5 gap-10 md:gap-16">
        <div className="lg:col-span-3 flex flex-col gap-8">
          <div className="flex items-center gap-4">
            <div className="w-6 h-px bg-sulfur" />
            <p className="text-[9px] tracking-[0.5em] uppercase text-gunmetal">
              {NARRATIVE_LABELS[narrative]} Perspective
            </p>
          </div>
          {narrativeText ? (
            <EditableNarrative
              text={narrativeText}
              narrative={narrative}
              listingId={listing.listingId}
              ownerClerkId={ownerClerkId}
            />
          ) : (
            <p className="text-gunmetal text-base italic">
              AI narratives have not yet been generated for this listing.
            </p>
          )}
          <p className="text-gunmetal text-[10px] tracking-widest uppercase flex items-center gap-2">
            <span className="w-3 h-px bg-gunmetal/40" />
            AI-crafted copy · Powered by Lux Engine
          </p>
        </div>

        <div className="lg:col-span-2 flex flex-col gap-6 pt-2">
          <h3
            style={{ fontFamily: "var(--font-playfair)" }}
            className="text-white text-xl font-normal"
          >
            Property at a Glance
          </h3>
          <div className="grid grid-cols-2 gap-3 md:gap-4">
            {[
              listing.beds ? { label: "Bedrooms", value: listing.beds } : null,
              listing.baths
                ? { label: "Bathrooms", value: listing.baths }
                : null,
              listing.sqFt
                ? { label: "Square Feet", value: listing.sqFt.toLocaleString() }
                : null,
              listing.yearBuilt
                ? { label: "Year Built", value: listing.yearBuilt }
                : null,
              listing.sqFt
                ? {
                    label: "Price / SF",
                    value: `$${Math.round(listing.price / listing.sqFt).toLocaleString()}`,
                  }
                : null,
              listing.propType
                ? { label: "Type", value: listing.propType }
                : null,
            ]
              .filter(Boolean)
              .map(
                (s) =>
                  s && (
                    <div
                      key={s.label}
                      className="border border-surface-border bg-surface p-3 md:p-4 flex flex-col gap-1"
                    >
                      <p className="text-[8px] md:text-[9px] tracking-[0.3em] uppercase text-gunmetal">
                        {s.label}
                      </p>
                      <p
                        style={{ fontFamily: "var(--font-playfair)" }}
                        className="text-sulfur text-xl md:text-2xl font-light"
                      >
                        {s.value}
                      </p>
                    </div>
                  ),
              )}
          </div>
        </div>
      </section>

      {/* Photo gallery */}
      {listing.images.length > 1 && (
        <section className="max-w-6xl mx-auto px-4 md:px-8 pb-12 md:pb-20 flex flex-col gap-8">
          <div className="flex items-center gap-4">
            <div className="w-6 h-px bg-sulfur" />
            <p className="text-[9px] tracking-[0.5em] uppercase text-gunmetal">
              Photography
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-3">
            <div
              className="col-span-2 img-zoom overflow-hidden h-52 md:h-80 cursor-pointer"
              onClick={() => setLightboxIdx(1)}
            >
              <img
                src={listing.images[1]}
                alt="Interior"
                className="w-full h-full object-cover"
              />
            </div>
            {listing.images.slice(2, 4).map((src, i) => (
              <div
                key={i}
                className="img-zoom overflow-hidden cursor-pointer"
                style={{ height: "calc(10rem - 0.375rem)" }}
                onClick={() => setLightboxIdx(i + 2)}
              >
                <img
                  src={src}
                  alt={`Photo ${i + 2}`}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
            {listing.images.slice(4).map((src, i) => (
              <div
                key={i}
                className="img-zoom overflow-hidden h-40 md:h-52 cursor-pointer"
                onClick={() => setLightboxIdx(i + 4)}
              >
                <img
                  src={src}
                  alt={`Photo ${i + 4}`}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Details table */}
      <section className="max-w-6xl mx-auto px-4 md:px-8 pb-12 md:pb-20">
        <div className="border border-surface-border">
          <div className="border-b border-surface-border px-4 md:px-8 py-5 flex items-center gap-3">
            <div className="w-4 h-px bg-sulfur/60" />
            <p className="text-[9px] tracking-[0.4em] uppercase text-gunmetal">
              Listing Details
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2">
            {[
              { label: "MLS Listing ID", value: listing.listingId },
              { label: "MLS Board", value: listing.mlsName ?? "—" },
              { label: "Status", value: listing.status },
              { label: "Property Type", value: listing.propType ?? "—" },
              listing.yearBuilt
                ? { label: "Year Built", value: listing.yearBuilt }
                : null,
              { label: "Price", value: fmt(listing.price) },
              listing.sqFt
                ? {
                    label: "Square Footage",
                    value: `${listing.sqFt.toLocaleString()} SF`,
                  }
                : null,
              listing.listingOfficeName
                ? {
                    label: "Listing Office",
                    value: listing.listingOfficeName,
                    wide: true,
                  }
                : null,
            ]
              .filter(Boolean)
              .map(
                (row) =>
                  row && (
                    <div
                      key={row.label}
                      className={`px-4 md:px-8 py-4 border-b border-surface-border/60 flex justify-between items-center gap-4 ${(row as { wide?: boolean }).wide ? "sm:col-span-2" : ""}`}
                    >
                      <span className="text-[9px] md:text-[10px] tracking-[0.3em] uppercase text-gunmetal flex-shrink-0">
                        {row.label}
                      </span>
                      <span className="text-white text-sm text-right">
                        {String(row.value)}
                      </span>
                    </div>
                  ),
              )}
          </div>
        </div>
      </section>

      {/* Contact */}
      <section
        ref={contactRef}
        className="max-w-6xl mx-auto px-4 md:px-8 pb-12 md:pb-20"
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 border border-surface-border">
          <div className="bg-surface p-6 md:p-10 flex flex-col gap-6 md:gap-8 border-b lg:border-b-0 lg:border-r border-surface-border">
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <div className="w-4 h-px bg-sulfur/60" />
                <p className="text-[9px] tracking-[0.4em] uppercase text-gunmetal">
                  Private Showing
                </p>
              </div>
              <h2
                style={{ fontFamily: "var(--font-playfair)" }}
                className="text-white text-2xl md:text-4xl font-normal leading-tight"
              >
                Schedule a Private Tour
              </h2>
            </div>
            <div className="flex flex-col gap-2">
              <p
                style={{ fontFamily: "var(--font-playfair)" }}
                className="text-sulfur text-xl md:text-2xl font-light"
              >
                {fmt(listing.price)}
              </p>
              <p className="text-white text-sm">{listing.address}</p>
              <p className="text-gunmetal text-sm">
                {listing.city}, {listing.state} {listing.zip}
              </p>
            </div>
            {listing.agentId && (
              <div className="border-t border-surface-border pt-6 flex items-center gap-2 flex-wrap">
                <span className="text-[9px] tracking-[0.25em] uppercase text-gunmetal">
                  Agent ID
                </span>
                <span className="text-sulfur text-xs font-mono">
                  {listing.agentId}
                </span>
                {listing.mlsName && (
                  <>
                    <span className="text-gunmetal text-[10px]">·</span>
                    <span className="border border-surface-border text-gunmetal text-[9px] tracking-widest px-2 py-0.5">
                      {listing.mlsName}
                    </span>
                  </>
                )}
              </div>
            )}
          </div>
          <div className="p-6 md:p-10">
            <ContactForm siteId={siteId} />
          </div>
        </div>
      </section>

      {/* IDX footer */}
      {listing.listingOfficeName && (
        <div className="max-w-6xl mx-auto px-4 md:px-8 pb-8">
          <IDXFooter
            listingOfficeName={listing.listingOfficeName}
            mlsName={listing.mlsName}
          />
        </div>
      )}

      <footer className="border-t border-surface-border bg-obsidian-deep">
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span
            style={{
              fontFamily: "var(--font-playfair)",
              letterSpacing: "0.25em",
            }}
            className="text-gunmetal text-sm uppercase"
          >
            Lux Engine
          </span>
          <p className="text-gunmetal text-[10px] tracking-widest">
            Luxury property sites · Powered by AI
          </p>
          <Link
            href="/"
            className="text-gunmetal text-[10px] tracking-widest uppercase hover:text-white transition-colors"
          >
            List Your Property →
          </Link>
        </div>
      </footer>

      {/* Mobile bottom CTA bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-obsidian-deep/95 backdrop-blur border-t border-surface-border p-3 flex gap-2">
        <button
          onClick={() => {
            contactRef.current?.scrollIntoView({ behavior: "smooth" });
            setMobileMenuOpen(false);
          }}
          className="flex-1 bg-cinnabar text-white py-3 text-[9px] tracking-[0.3em] uppercase font-medium"
        >
          Schedule Tour
        </button>
        <button
          onClick={() => generateFlyer(flyerData)}
          className="border border-surface-border text-gunmetal py-3 px-4 text-[9px] tracking-[0.3em] uppercase"
        >
          Flyer
        </button>
      </div>

      {/* Lightbox */}
      {lightboxIdx !== null && (
        <Lightbox
          images={listing.images}
          currentIdx={lightboxIdx}
          onClose={() => setLightboxIdx(null)}
          onNav={setLightboxIdx}
        />
      )}
    </div>
  );
}

/* ── Editable Narrative (WYSIWYG) ─────────────────────────────── */

function EditableNarrative({
  text,
  narrative,
  listingId,
  ownerClerkId,
}: {
  text: string;
  narrative: "romantic" | "investor" | "family";
  listingId: string;
  ownerClerkId?: string;
}) {
  const { userId } = useAuth();
  const isOwner = userId && ownerClerkId && userId === ownerClerkId;
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(text);
  const [saving, setSaving] = useState(false);
  const updateNarrative = useMutation(api.listings.updateNarrative);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setDraft(text);
  }, [text]);

  useEffect(() => {
    if (editing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height =
        textareaRef.current.scrollHeight + "px";
    }
  }, [editing]);

  const handleSave = useCallback(async () => {
    if (draft === text) {
      setEditing(false);
      return;
    }
    setSaving(true);
    try {
      await updateNarrative({ listingId, narrative, text: draft });
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }, [draft, text, updateNarrative, listingId, narrative]);

  if (!isOwner) {
    return (
      <blockquote
        style={{ fontFamily: "var(--font-cormorant)" }}
        className="text-xl md:text-3xl font-light italic leading-relaxed text-cream/90"
      >
        {text}
      </blockquote>
    );
  }

  if (editing) {
    return (
      <div className="flex flex-col gap-3">
        <textarea
          ref={textareaRef}
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value);
            e.target.style.height = "auto";
            e.target.style.height = e.target.scrollHeight + "px";
          }}
          className="w-full bg-obsidian-deep border border-sulfur/30 text-cream/90 px-4 py-3 italic leading-relaxed resize-none focus:outline-none focus:border-sulfur"
          style={{ fontFamily: "var(--font-cormorant)", fontSize: "1.5rem" }}
        />
        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-sulfur text-obsidian text-[9px] tracking-[0.3em] uppercase px-5 py-2 hover:bg-sulfur/90 transition-colors disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save"}
          </button>
          <button
            onClick={() => {
              setDraft(text);
              setEditing(false);
            }}
            className="text-gunmetal text-[9px] tracking-[0.3em] uppercase px-5 py-2 hover:text-white transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="group relative cursor-pointer"
      onClick={() => setEditing(true)}
    >
      <blockquote
        style={{ fontFamily: "var(--font-cormorant)" }}
        className="text-xl md:text-3xl font-light italic leading-relaxed text-cream/90 group-hover:text-cream transition-colors"
      >
        {text}
      </blockquote>
      <div className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-sulfur text-obsidian text-[8px] tracking-[0.3em] uppercase px-2 py-1">
        Edit
      </div>
    </div>
  );
}

/* ── Image Lightbox ───────────────────────────────────────────── */

function Lightbox({
  images,
  currentIdx,
  onClose,
  onNav,
}: {
  images: string[];
  currentIdx: number;
  onClose: () => void;
  onNav: (idx: number) => void;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const previousFocus =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    dialogRef.current?.focus();

    function trapFocus(event: KeyboardEvent) {
      if (event.key !== "Tab" || !dialogRef.current) return;
      const focusable = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
        ),
      );
      if (focusable.length === 0) {
        event.preventDefault();
        dialogRef.current.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    window.addEventListener("keydown", trapFocus);
    return () => {
      window.removeEventListener("keydown", trapFocus);
      previousFocus?.focus();
    };
  }, []);

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label="Property photo viewer"
      tabIndex={-1}
      className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center"
      onClick={onClose}
    >
      <div className="absolute top-4 right-4 flex items-center gap-4 z-10">
        <span className="text-gunmetal text-[10px] tracking-widest tabular-nums">
          {currentIdx + 1} / {images.length}
        </span>
        <button
          onClick={onClose}
          aria-label="Close photo viewer"
          className="text-white hover:text-sulfur transition-colors p-2"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </div>

      {currentIdx > 0 && (
        <button
          aria-label="View previous photo"
          onClick={(e) => {
            e.stopPropagation();
            onNav(currentIdx - 1);
          }}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-white/60 hover:text-white transition-colors p-3"
        >
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <path d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      )}

      <img
        src={images[currentIdx]}
        alt={`Photo ${currentIdx + 1}`}
        className="max-h-[85vh] max-w-[90vw] object-contain"
        onClick={(e) => e.stopPropagation()}
      />

      {currentIdx < images.length - 1 && (
        <button
          aria-label="View next photo"
          onClick={(e) => {
            e.stopPropagation();
            onNav(currentIdx + 1);
          }}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-white/60 hover:text-white transition-colors p-3"
        >
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <path d="M9 5l7 7-7 7" />
          </svg>
        </button>
      )}

      {/* Thumbnail strip */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 max-w-[90vw] overflow-x-auto px-4">
        {images.map((src, i) => (
          <button
            key={i}
            aria-label={`View photo ${i + 1}`}
            aria-current={i === currentIdx ? "true" : undefined}
            onClick={(e) => {
              e.stopPropagation();
              onNav(i);
            }}
            className={`flex-shrink-0 w-12 h-12 overflow-hidden border-2 transition-all ${i === currentIdx ? "border-sulfur" : "border-transparent opacity-50 hover:opacity-80"}`}
          >
            <img src={src} alt="" className="w-full h-full object-cover" />
          </button>
        ))}
      </div>
    </div>
  );
}

/* ── Contact form ───────────────────────────────────────────── */

function ContactForm({ siteId }: { siteId: Id<"sites"> }) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
    preferredDate: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const submitLead = useMutation(api.leads.submitLead);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await submitLead({
        siteId,
        name: form.name,
        email: form.email,
        phone: form.phone || undefined,
        message: form.message || undefined,
        preferredDate: form.preferredDate || undefined,
      });
      setSubmitted(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-6 py-12 text-center">
        <div className="w-12 h-12 border border-sulfur/40 flex items-center justify-center">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path
              d="M4 10l5 5 7-9"
              stroke="#F2FF00"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <div className="flex flex-col gap-2">
          <p
            style={{ fontFamily: "var(--font-playfair)" }}
            className="text-white text-xl"
          >
            Request Received
          </p>
          <p className="text-gunmetal text-sm">
            Your agent will be in touch within 24 hours.
          </p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField
          label="Full Name"
          name="name"
          value={form.name}
          onChange={handleChange}
          required
          placeholder="Jane Smith"
        />
        <FormField
          label="Email"
          name="email"
          type="email"
          value={form.email}
          onChange={handleChange}
          required
          placeholder="jane@example.com"
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField
          label="Phone"
          name="phone"
          type="tel"
          value={form.phone}
          onChange={handleChange}
          placeholder="(602) 555-0100"
        />
        <FormField
          label="Preferred Date"
          name="preferredDate"
          type="date"
          value={form.preferredDate}
          onChange={handleChange}
        />
      </div>
      <label className="flex flex-col gap-1.5">
        <span className="text-[9px] tracking-[0.3em] uppercase text-gunmetal">
          Message
        </span>
        <textarea
          name="message"
          value={form.message}
          onChange={handleChange}
          maxLength={2000}
          rows={4}
          placeholder="I'd love to schedule a showing..."
          className="w-full bg-obsidian-deep border border-surface-border text-white text-sm px-4 py-2.5 focus:outline-none focus:border-gunmetal placeholder:text-gunmetal resize-none transition-colors duration-200"
          style={{ fontFamily: "var(--font-cormorant)", fontSize: "1rem" }}
        />
      </label>
      <button
        type="submit"
        disabled={submitting}
        className="w-full bg-cinnabar text-white py-4 text-[9px] tracking-[0.4em] uppercase font-medium hover:bg-cinnabar-dark transition-colors duration-300 mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {submitting ? "Sending..." : "Request a Private Showing"}
      </button>
      {error && (
        <p role="alert" className="text-cinnabar text-[10px] text-center">
          {error}
        </p>
      )}
      <p className="text-gunmetal text-[10px] text-center leading-relaxed">
        By submitting, you agree to be contacted by the listing agent.
      </p>
    </form>
  );
}

function FormField({
  label,
  name,
  value,
  onChange,
  required,
  placeholder,
  type = "text",
}: {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
  placeholder?: string;
  type?: string;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[9px] tracking-[0.3em] uppercase text-gunmetal">
        {label}
      </span>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        placeholder={placeholder}
        maxLength={type === "email" ? 254 : type === "tel" ? 40 : 100}
        className="w-full bg-obsidian-deep border border-surface-border text-white text-sm px-4 py-2.5 focus:outline-none focus:border-gunmetal placeholder:text-gunmetal transition-colors duration-200"
      />
    </label>
  );
}

/* ── Loading / error states ─────────────────────────────────── */

function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-obsidian-deep flex items-center justify-center">
      <div className="flex flex-col items-center gap-5">
        <div className="w-10 h-10 border border-surface-border border-t-sulfur/60 rounded-full animate-spin" />
        <p className="text-[9px] tracking-[0.5em] uppercase text-gunmetal">
          Loading Property
        </p>
      </div>
    </div>
  );
}

function SiteNotFound() {
  return (
    <div className="min-h-screen bg-obsidian-deep flex flex-col items-center justify-center gap-8 text-center px-8">
      <div className="flex flex-col items-center gap-3">
        <div className="w-px h-16 bg-gradient-to-b from-transparent to-gunmetal/30" />
        <div className="w-8 h-8 border border-surface-border flex items-center justify-center">
          <span className="text-gunmetal text-base">∅</span>
        </div>
      </div>
      <div className="flex flex-col gap-3">
        <p className="text-[9px] tracking-[0.5em] uppercase text-gunmetal">
          Site Unavailable
        </p>
        <h1
          style={{ fontFamily: "var(--font-playfair)" }}
          className="text-white text-4xl font-normal"
        >
          This listing is no longer active.
        </h1>
        <p className="text-gunmetal text-sm max-w-sm">
          The property site you&apos;re looking for may have been taken offline
          or the URL may have changed.
        </p>
      </div>
      <Link
        href="/"
        className="border border-sulfur/30 text-sulfur text-[9px] tracking-[0.35em] uppercase px-8 py-3 hover:bg-sulfur hover:text-obsidian transition-all duration-300"
      >
        Lux Engine Home
      </Link>
    </div>
  );
}
