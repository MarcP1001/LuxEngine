"use client";

import { useState } from "react";
import IDXFooter from "@/components/IDXFooter";

const MOCK_LISTINGS = [
  {
    id: "1",
    address: "7832 E Camelback Road",
    unit: null,
    city: "Scottsdale",
    state: "AZ",
    zip: "85251",
    price: 3_495_000,
    beds: 5,
    baths: 5.5,
    sqFt: 6200,
    propType: "Single Family",
    yearBuilt: 2019,
    image:
      "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&q=90",
    officeName: "Russ Lyon Sotheby's International Realty",
    mlsName: "ARMLS",
    siteStatus: "draft" as const,
    aiRomantic:
      "Step into a world where architectural precision meets desert serenity. This masterwork commands the Scottsdale skyline with floor-to-ceiling glass that frames the McDowell Mountains like living art. Every room is a curated sanctuary — from the temperature-controlled wine cellar to the cantilevered infinity pool that appears to dissolve into the horizon at dusk.",
    aiInvestor:
      "A rare opportunity in Old Town Scottsdale's ultra-luxury corridor. Comparable estates have appreciated 22% year-over-year, with the short-term rental market commanding $4,500–$6,000 per night during peak season. The property's 6,200 sq ft footprint on a 0.8-acre lot represents exceptional land value in a supply-constrained luxury market with no comparable new inventory.",
    aiFamily:
      "Room to breathe and space to grow — five generous en-suite bedrooms ensure every family member has their private retreat. The gourmet kitchen opens to a resort-style backyard with a heated pool, sport court, and built-in BBQ pavilion, making every weekend feel like a five-star vacation. Zoned for award-winning Scottsdale Unified schools within a guard-gated community.",
  },
  {
    id: "2",
    address: "24601 N 104th Place",
    unit: null,
    city: "Scottsdale",
    state: "AZ",
    zip: "85255",
    price: 1_875_000,
    beds: 4,
    baths: 3.5,
    sqFt: 4100,
    propType: "Single Family",
    yearBuilt: 2016,
    image:
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=900&q=85",
    officeName: "Russ Lyon Sotheby's International Realty",
    mlsName: "ARMLS",
    siteStatus: "published" as const,
    aiRomantic: null,
    aiInvestor: null,
    aiFamily: null,
  },
  {
    id: "3",
    address: "5901 N Pima Road",
    unit: "PH 3402",
    city: "Scottsdale",
    state: "AZ",
    zip: "85250",
    price: 2_250_000,
    beds: 3,
    baths: 3,
    sqFt: 3480,
    propType: "Penthouse",
    yearBuilt: 2021,
    image:
      "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=900&q=85",
    officeName: "Russ Lyon Sotheby's International Realty",
    mlsName: "ARMLS",
    siteStatus: "draft" as const,
    aiRomantic: null,
    aiInvestor: null,
    aiFamily: null,
  },
];

type Narrative = "romantic" | "investor" | "family";

const totalValue = MOCK_LISTINGS.reduce((s, l) => s + l.price, 0);
const liveCount = MOCK_LISTINGS.filter(
  (l) => l.siteStatus === "published",
).length;

export default function DemoPage() {
  const [activeNarrative, setActiveNarrative] = useState<Narrative>("romantic");

  const featured = MOCK_LISTINGS[0];
  const grid = MOCK_LISTINGS.slice(1);

  const narrativeText: Record<Narrative, string | null> = {
    romantic: featured.aiRomantic,
    investor: featured.aiInvestor,
    family: featured.aiFamily,
  };

  return (
    <div className="min-h-screen bg-obsidian-deep">
      {/* ── Header ───────────────────────────────────────── */}
      <header className="border-b border-surface-border bg-obsidian-deep/95 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-5">
            <span
              style={{
                fontFamily: "var(--font-playfair)",
                letterSpacing: "0.25em",
              }}
              className="text-sulfur text-lg font-medium uppercase"
            >
              Lux Engine
            </span>
            <span className="hidden md:block w-px h-4 bg-surface-border" />
            <span className="hidden md:block text-gunmetal text-[10px] tracking-[0.35em] uppercase">
              Luxury Marketing
            </span>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-[9px] tracking-[0.3em] uppercase text-gunmetal border border-surface-border px-3 py-1.5">
              Demo Mode
            </span>
            <div className="w-8 h-8 rounded-full bg-surface border border-surface-border flex items-center justify-center">
              <span className="text-[10px] text-gunmetal tracking-wide">
                MA
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* ── Stats bar ────────────────────────────────────── */}
      <div className="border-b border-surface-border">
        <div className="max-w-7xl mx-auto px-8 py-4 flex flex-wrap gap-8">
          {[
            { label: "Active Listings", value: String(MOCK_LISTINGS.length) },
            {
              label: "Portfolio Value",
              value: `$${(totalValue / 1_000_000).toFixed(1)}M`,
              accent: true,
            },
            { label: "Live Sites", value: String(liveCount) },
            { label: "Agent ID", value: "SA654321" },
          ].map((stat) => (
            <div key={stat.label} className="flex flex-col gap-0.5">
              <p className="text-[9px] tracking-[0.35em] uppercase text-gunmetal">
                {stat.label}
              </p>
              <p
                style={
                  stat.accent
                    ? { fontFamily: "var(--font-playfair)" }
                    : undefined
                }
                className={`text-lg font-light ${stat.accent ? "text-sulfur" : "text-white"}`}
              >
                {stat.value}
              </p>
            </div>
          ))}

          <div className="ml-auto self-center">
            <button className="group flex items-center gap-2.5 border border-sulfur/30 text-sulfur px-5 py-2 text-[9px] tracking-[0.35em] uppercase hover:bg-sulfur hover:text-obsidian transition-all duration-300">
              <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none">
                <path
                  d="M10 6A4 4 0 1 1 6 2"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
                <path
                  d="M10 2v4H6"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Sync Listings
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-12 flex flex-col gap-16">
        {/* ── Section label ────────────────────────────── */}
        <div className="flex items-center gap-6">
          <div className="w-8 h-px bg-sulfur" />
          <p className="text-[9px] tracking-[0.5em] uppercase text-gunmetal">
            Your Inventory
          </p>
        </div>

        {/* ── Featured listing ─────────────────────────── */}
        <div
          className="grid grid-cols-1 lg:grid-cols-2 border border-surface-border card-luxury overflow-hidden"
          style={{ minHeight: "520px" }}
        >
          {/* Left: photo */}
          <div className="img-zoom relative" style={{ minHeight: "400px" }}>
            <img
              src={featured.image}
              alt={featured.address}
              className="w-full h-full object-cover"
              style={{ minHeight: "400px" }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-surface/60 hidden lg:block" />
            <div className="absolute inset-0 bg-gradient-to-t from-surface/80 to-transparent lg:hidden" />

            {/* Property type pill */}
            <div className="absolute top-6 left-6 flex gap-2">
              <span className="text-[9px] tracking-[0.3em] uppercase text-white/60 bg-obsidian/70 backdrop-blur-sm px-3 py-1.5 border border-white/10">
                {featured.propType}
              </span>
              <span className="text-[9px] tracking-[0.3em] uppercase bg-obsidian/80 backdrop-blur-sm px-3 py-1.5 border border-gunmetal text-gunmetal">
                Draft
              </span>
            </div>
          </div>

          {/* Right: details */}
          <div className="flex flex-col justify-between p-10 gap-8 bg-surface">
            <div className="flex flex-col gap-6">
              {/* Location */}
              <p className="text-[9px] tracking-[0.5em] uppercase text-gunmetal">
                Scottsdale — Arizona
              </p>

              {/* Address */}
              <div>
                <h2
                  style={{ fontFamily: "var(--font-playfair)" }}
                  className="text-white text-3xl font-normal leading-tight"
                >
                  {featured.address}
                </h2>
                <p
                  style={{ fontFamily: "var(--font-playfair)" }}
                  className="text-sulfur text-4xl font-light mt-4 tracking-wide"
                >
                  $3,495,000
                </p>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-3 text-[10px] tracking-[0.25em] uppercase text-gunmetal">
                <span>5 Bed</span>
                <span className="text-surface-border">—</span>
                <span>5.5 Bath</span>
                <span className="text-surface-border">—</span>
                <span>6,200 SF</span>
                <span className="text-surface-border">—</span>
                <span>Est. {featured.yearBuilt}</span>
              </div>

              {/* Divider */}
              <div className="h-px bg-surface-border" />

              {/* AI narrative tabs */}
              <div className="flex flex-col gap-4">
                <div className="flex border border-surface-border">
                  {(["romantic", "investor", "family"] as Narrative[]).map(
                    (n) => (
                      <button
                        key={n}
                        onClick={() => setActiveNarrative(n)}
                        className={`flex-1 py-2.5 text-[9px] tracking-[0.25em] uppercase transition-colors duration-200 ${
                          activeNarrative === n
                            ? "bg-sulfur text-obsidian font-semibold"
                            : "text-gunmetal hover:text-white"
                        }`}
                      >
                        {n === "romantic"
                          ? "Romantic"
                          : n === "investor"
                            ? "Investor"
                            : "Family"}
                      </button>
                    ),
                  )}
                </div>

                <p
                  style={{ fontFamily: "var(--font-cormorant)" }}
                  className="text-white/70 text-lg leading-relaxed font-light"
                >
                  {narrativeText[activeNarrative]}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <IDXFooter
                listingOfficeName={featured.officeName}
                mlsName={featured.mlsName}
              />

              {/* CTA */}
              <div className="flex gap-3">
                <button className="flex-1 py-3.5 bg-cinnabar text-white text-[9px] tracking-[0.4em] uppercase font-medium hover:bg-cinnabar-dark transition-colors duration-300">
                  Launch Site
                </button>
                <button className="py-3.5 px-6 border border-surface-border text-gunmetal text-[9px] tracking-[0.3em] uppercase hover:border-gunmetal hover:text-white transition-colors duration-300">
                  Flyer
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── Grid listings ────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {grid.map((listing) => (
            <GridCard key={listing.id} listing={listing} />
          ))}
        </div>

        {/* ── Empty state teaser (shows after 2 grid cards) ── */}
        <div className="border border-dashed border-surface-border flex flex-col items-center justify-center py-20 gap-4 text-center">
          <div className="w-8 h-8 border border-gunmetal flex items-center justify-center">
            <span className="text-gunmetal text-lg">+</span>
          </div>
          <p className="text-gunmetal text-[10px] tracking-[0.4em] uppercase">
            More listings sync automatically
          </p>
          <p className="text-gunmetal text-xs max-w-xs">
            When you add your IDX key, all active listings update every night.
          </p>
        </div>
      </div>
    </div>
  );
}

function GridCard({ listing }: { listing: (typeof MOCK_LISTINGS)[number] }) {
  const isLive = listing.siteStatus === "published";

  return (
    <article className="card-luxury group border border-surface-border bg-surface flex flex-col overflow-hidden">
      {/* Hero */}
      <div
        className="img-zoom relative flex-shrink-0"
        style={{ height: "260px" }}
      >
        <img
          src={listing.image}
          alt={listing.address}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/20 to-transparent" />

        <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
          <span className="text-[9px] tracking-[0.3em] uppercase text-white/50 bg-obsidian/70 backdrop-blur-sm px-2.5 py-1 border border-white/10">
            {listing.propType}
          </span>
          <span
            className={`text-[9px] tracking-[0.3em] uppercase px-2.5 py-1 font-medium ${
              isLive
                ? "bg-sulfur text-obsidian"
                : "bg-obsidian/80 backdrop-blur-sm text-gunmetal border border-gunmetal"
            }`}
          >
            {isLive ? "Live" : "Draft"}
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-col flex-1 p-6 gap-4">
        <p className="text-[9px] tracking-[0.4em] uppercase text-gunmetal">
          {listing.city} — {listing.state}
        </p>

        <div className="flex flex-col gap-2">
          <h3
            style={{ fontFamily: "var(--font-playfair)" }}
            className="text-white text-xl font-normal leading-snug group-hover:text-cream transition-colors duration-300"
          >
            {listing.address}
            {listing.unit && (
              <span className="text-gunmetal text-base ml-2">
                {listing.unit}
              </span>
            )}
          </h3>
          <p
            style={{ fontFamily: "var(--font-playfair)" }}
            className="text-sulfur text-2xl font-light tracking-wide"
          >
            ${listing.price.toLocaleString()}
          </p>
        </div>

        <div className="flex items-center gap-2.5 text-gunmetal text-[10px] tracking-[0.2em] uppercase">
          <span>{listing.beds} Bed</span>
          <span className="text-surface-border">—</span>
          <span>{listing.baths} Bath</span>
          <span className="text-surface-border">—</span>
          <span>{listing.sqFt.toLocaleString()} SF</span>
        </div>

        <div className="h-px bg-gradient-to-r from-transparent via-surface-border to-transparent" />

        <div className="flex gap-2 mt-auto">
          <button className="flex-1 py-2.5 border border-surface-border text-gunmetal text-[9px] tracking-[0.3em] uppercase hover:border-gunmetal hover:text-white transition-colors duration-300">
            Preview
          </button>
          <button
            className={`flex-1 py-2.5 text-[9px] tracking-[0.3em] uppercase font-medium transition-all duration-300 ${
              isLive
                ? "border border-sulfur/50 text-sulfur hover:bg-sulfur hover:text-obsidian"
                : "bg-cinnabar text-white hover:bg-cinnabar-dark"
            }`}
          >
            {isLive ? "↗  View Site" : "Launch Site"}
          </button>
        </div>
      </div>
    </article>
  );
}
