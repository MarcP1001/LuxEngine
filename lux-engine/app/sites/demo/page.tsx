"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import IDXFooter from "@/components/IDXFooter";

/* ─── Mock listing data ─────────────────────────────────────── */

const LISTING = {
  address: "8847 N Ironwood Crest Drive",
  city: "Paradise Valley",
  state: "AZ",
  zip: "85253",
  price: 4850000,
  beds: 5,
  baths: 5.5,
  sqFt: 7200,
  yearBuilt: 2019,
  propType: "Single Family Residence",
  status: "Active",
  mlsName: "ARMLS",
  mlsId: "6801447",
  listingOfficeName: "Russ Lyon Sotheby's International Realty",
  agentId: "a5f87c",
  agentName: "Michael Harrington",
  images: [
    "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1600&q=85&auto=format",
    "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200&q=80&auto=format",
    "https://images.unsplash.com/photo-1600607687644-aac4c3eac7f4?w=1200&q=80&auto=format",
    "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200&q=80&auto=format",
    "https://images.unsplash.com/photo-1571055107559-3e67626fa8be?w=1200&q=80&auto=format",
    "https://images.unsplash.com/photo-1560448204-603b3fc33ddc?w=1200&q=80&auto=format",
  ],
  narratives: {
    romantic: `Perched at the pinnacle of Paradise Valley's most exclusive enclave, this extraordinary residence transcends the definition of home — it is a living work of art. Morning light filters through walls of floor-to-ceiling glass, casting golden ribbons across stone floors imported from the quarries of Tuscany. The kitchen, a masterwork of precision and restraint, centers on a twelve-foot island of book-matched Calacatta marble, where quiet mornings and lavish gatherings share the same effortless stage. Beyond the disappearing glass walls, a resort-caliber pool appears to spill over the mountain's edge into the valley below — a horizon infinity made real. Every corridor, every courtyard, every carefully chosen material whispers the same singular promise: nothing here was left to chance.`,
    investor: `8847 N Ironwood Crest Drive represents a rare opportunity to acquire a trophy asset in one of the Southwest's most supply-constrained luxury markets. Paradise Valley — the wealthiest municipality per capita in Arizona — recorded a median sold price of $3.2M in 2024 with only 23 days average market time at this price tier. Built in 2019 to the highest standards of construction with no deferred maintenance, this asset carries an estimated cap rate of 4.1% as a short-term luxury rental and has demonstrated 11.3% annual appreciation over its hold period. Comparable sales within 0.5 miles closed between $4.6M–$5.4M in the trailing 18 months. A turnkey acquisition with compelling upside in an undersupplied micro-market.`,
    family: `From the moment you arrive, 8847 N Ironwood Crest Drive feels like the home you always imagined. Five generous bedroom suites — each with its own private bath — means every family member has a true sanctuary. The chef's kitchen opens directly to the great room where memories are made: homework at the island, movie nights on the sunken media wall, laughter that echoes off the vaulted ceilings. Outside, the resort-style pool and spa anchor a fully equipped outdoor kitchen and sport court, so weekends never need an excuse. Zoned to some of the region's most respected schools and just minutes from the trailheads of North Mountain Preserve, this is a home built not just to impress — but to be truly, deeply lived in.`,
  },
};

/* ─── Agent's other listed properties ───────────────────────── */

const OTHER_LISTINGS = [
  {
    address: "24601 N 104th Place",
    city: "Scottsdale",
    state: "AZ",
    zip: "85255",
    price: 1875000,
    beds: 4,
    baths: 3.5,
    sqFt: 4100,
    propType: "Single Family",
    status: "Active",
    image:
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80&auto=format",
  },
  {
    address: "5901 N Pima Road #PH3",
    city: "Scottsdale",
    state: "AZ",
    zip: "85250",
    price: 2250000,
    beds: 3,
    baths: 3,
    sqFt: 3480,
    propType: "Penthouse",
    status: "Active",
    image:
      "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80&auto=format",
  },
  {
    address: "7770 N Mockingbird Lane",
    city: "Paradise Valley",
    state: "AZ",
    zip: "85253",
    price: 5400000,
    beds: 6,
    baths: 6.5,
    sqFt: 9200,
    propType: "Single Family",
    status: "Active",
    image:
      "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&q=80&auto=format",
  },
  {
    address: "4727 E Berneil Drive",
    city: "Paradise Valley",
    state: "AZ",
    zip: "85253",
    price: 1975000,
    beds: 4,
    baths: 4,
    sqFt: 3800,
    propType: "Single Family",
    status: "Active",
    image:
      "https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=800&q=80&auto=format",
  },
];

const NARRATIVE_LABELS: Record<string, string> = {
  romantic: "Romantic",
  investor: "Investor",
  family: "Family",
};

const fmt = (n: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);

/* ─── Main page ─────────────────────────────────────────────── */

export default function PropertyDemoPage() {
  const [narrative, setNarrative] = useState<
    "romantic" | "investor" | "family"
  >("romantic");
  const [navStuck, setNavStuck] = useState(false);
  const contactRef = useRef<HTMLDivElement>(null);
  const portfolioRef = useRef<HTMLDivElement>(null);

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

  return (
    <div className="min-h-screen bg-obsidian-deep text-white">
      {/* ── Top bar ──────────────────────────────────────── */}
      <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 h-14 bg-obsidian-deep/80 backdrop-blur border-b border-surface-border/50">
        <Link
          href="/"
          style={{
            fontFamily: "var(--font-playfair)",
            letterSpacing: "0.25em",
          }}
          className="text-sulfur text-base font-medium uppercase hover:text-sulfur/80 transition-colors duration-200"
        >
          Lux Engine
        </Link>
        <Link
          href="/"
          className="border border-sulfur/30 text-sulfur text-[9px] tracking-[0.35em] uppercase px-5 py-2 hover:bg-sulfur hover:text-obsidian transition-all duration-300"
        >
          List Your Home
        </Link>
      </div>

      {/* ── Hero ─────────────────────────────────────────── */}
      <section className="relative h-screen w-full overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center transition-transform duration-[12000ms] ease-out scale-105 hover:scale-100"
          style={{ backgroundImage: `url(${LISTING.images[0]})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-obsidian-deep via-obsidian-deep/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-obsidian-deep/60 via-transparent to-transparent" />
        <div className="absolute top-20 left-8">
          <span className="bg-obsidian-deep/70 border border-surface-border backdrop-blur text-gunmetal text-[9px] tracking-[0.4em] uppercase px-3 py-1.5">
            {LISTING.propType}
          </span>
        </div>
        <div className="absolute top-20 right-8">
          <span className="bg-sulfur text-obsidian text-[9px] tracking-[0.4em] uppercase px-3 py-1.5 font-semibold">
            {LISTING.status}
          </span>
        </div>
        <div className="absolute bottom-16 left-8 right-8 flex flex-col gap-4 max-w-3xl">
          <div className="flex items-center gap-3">
            <div className="w-6 h-px bg-sulfur/60" />
            <p className="text-[9px] tracking-[0.5em] uppercase text-gunmetal">
              {LISTING.city} · {LISTING.state} {LISTING.zip}
            </p>
          </div>
          <h1
            style={{ fontFamily: "var(--font-playfair)" }}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-normal leading-tight text-white"
          >
            {LISTING.address}
          </h1>
          <p
            style={{ fontFamily: "var(--font-playfair)" }}
            className="text-sulfur text-4xl md:text-5xl font-light"
          >
            {fmt(LISTING.price)}
          </p>
          <div className="flex items-center gap-6 pt-2">
            {[
              { value: LISTING.beds, label: "Beds" },
              { value: LISTING.baths, label: "Baths" },
              { value: LISTING.sqFt.toLocaleString(), label: "Sq Ft" },
              { value: LISTING.yearBuilt, label: "Built" },
            ].map((s, i) => (
              <div key={i} className="flex flex-col items-center gap-0.5">
                <span className="text-white text-base font-medium tabular-nums">
                  {s.value}
                </span>
                <span className="text-gunmetal text-[9px] tracking-[0.3em] uppercase">
                  {s.label}
                </span>
              </div>
            ))}
          </div>
        </div>
        <div className="absolute bottom-8 right-8 flex flex-col items-center gap-2 animate-bounce">
          <svg
            width="12"
            height="20"
            viewBox="0 0 12 20"
            fill="none"
            className="text-gunmetal"
          >
            <path
              d="M6 1v18M1 13l5 6 5-6"
              stroke="currentColor"
              strokeWidth="1.25"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </section>

      <div id="nav-sentinel" />

      {/* ── Sticky narrative nav ─────────────────────────── */}
      <div
        className={`sticky top-14 z-40 border-b border-surface-border transition-all duration-300 ${navStuck ? "bg-obsidian-deep/98 backdrop-blur shadow-2xl" : "bg-surface"}`}
      >
        <div className="max-w-6xl mx-auto px-8 h-14 flex items-center justify-between gap-4">
          <p className="hidden sm:block text-gunmetal text-[10px] tracking-widest tabular-nums">
            {LISTING.beds} Bed&nbsp;·&nbsp;{LISTING.baths} Bath&nbsp;·&nbsp;
            {LISTING.sqFt.toLocaleString()} SF&nbsp;·&nbsp;{fmt(LISTING.price)}
          </p>
          <div className="flex items-center gap-1 ml-auto">
            {(["romantic", "investor", "family"] as const).map((n) => (
              <button
                key={n}
                onClick={() => setNarrative(n)}
                className={`px-4 py-1.5 text-[9px] tracking-[0.3em] uppercase transition-all duration-200 ${narrative === n ? "text-obsidian bg-sulfur" : "text-gunmetal hover:text-white"}`}
              >
                {NARRATIVE_LABELS[n]}
              </button>
            ))}
          </div>
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

      {/* ── Narrative + overview ─────────────────────────── */}
      <section className="max-w-6xl mx-auto px-8 py-20 grid grid-cols-1 lg:grid-cols-5 gap-16">
        <div className="lg:col-span-3 flex flex-col gap-8">
          <div className="flex items-center gap-4">
            <div className="w-6 h-px bg-sulfur" />
            <p className="text-[9px] tracking-[0.5em] uppercase text-gunmetal">
              {NARRATIVE_LABELS[narrative]} Perspective
            </p>
          </div>
          <blockquote
            style={{ fontFamily: "var(--font-cormorant)" }}
            className="text-2xl md:text-3xl font-light italic leading-relaxed text-cream/90"
          >
            {LISTING.narratives[narrative]}
          </blockquote>
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
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: "Bedrooms", value: LISTING.beds },
              { label: "Bathrooms", value: LISTING.baths },
              { label: "Square Feet", value: LISTING.sqFt.toLocaleString() },
              { label: "Year Built", value: LISTING.yearBuilt },
              {
                label: "Price / SF",
                value: `$${Math.round(LISTING.price / LISTING.sqFt).toLocaleString()}`,
              },
              { label: "Property Type", value: "Single Family" },
            ].map((s) => (
              <div
                key={s.label}
                className="border border-surface-border bg-surface p-4 flex flex-col gap-1"
              >
                <p className="text-[9px] tracking-[0.3em] uppercase text-gunmetal">
                  {s.label}
                </p>
                <p
                  style={{ fontFamily: "var(--font-playfair)" }}
                  className="text-sulfur text-2xl font-light"
                >
                  {s.value}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Photo gallery ────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-8 pb-20 flex flex-col gap-8">
        <div className="flex items-center gap-4">
          <div className="w-6 h-px bg-sulfur" />
          <p className="text-[9px] tracking-[0.5em] uppercase text-gunmetal">
            Photography
          </p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <div className="col-span-2 img-zoom overflow-hidden h-72 md:h-96">
            <img
              src={LISTING.images[1]}
              alt="Living area"
              className="w-full h-full object-cover"
            />
          </div>
          {LISTING.images.slice(2, 4).map((src, i) => (
            <div
              key={i}
              className="img-zoom overflow-hidden"
              style={{ height: "calc(192px - 0.375rem)" }}
            >
              <img
                src={src}
                alt={`Interior ${i + 2}`}
                className="w-full h-full object-cover"
              />
            </div>
          ))}
          {LISTING.images.slice(4).map((src, i) => (
            <div key={i} className="img-zoom overflow-hidden h-52">
              <img
                src={src}
                alt={`Exterior ${i + 1}`}
                className="w-full h-full object-cover"
              />
            </div>
          ))}
        </div>
        <p className="text-gunmetal text-[10px] tracking-widest text-right">
          Photography &middot; {LISTING.city} &middot; {LISTING.yearBuilt}
        </p>
      </section>

      {/* ── Property details table ───────────────────────── */}
      <section className="max-w-6xl mx-auto px-8 pb-20">
        <div className="border border-surface-border">
          <div className="border-b border-surface-border px-8 py-5 flex items-center gap-3">
            <div className="w-4 h-px bg-sulfur/60" />
            <p className="text-[9px] tracking-[0.4em] uppercase text-gunmetal">
              Listing Details
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2">
            {[
              { label: "MLS Listing ID", value: LISTING.mlsId },
              { label: "MLS Board", value: LISTING.mlsName },
              { label: "Status", value: LISTING.status },
              { label: "Property Type", value: LISTING.propType },
              { label: "Year Built", value: LISTING.yearBuilt },
              { label: "Price", value: fmt(LISTING.price) },
              {
                label: "Square Footage",
                value: `${LISTING.sqFt.toLocaleString()} SF`,
              },
              {
                label: "Price Per SF",
                value: `$${Math.round(LISTING.price / LISTING.sqFt).toLocaleString()}`,
              },
              { label: "Bedrooms", value: LISTING.beds },
              { label: "Bathrooms", value: LISTING.baths },
              {
                label: "Listing Office",
                value: LISTING.listingOfficeName,
                wide: true,
              },
            ].map((row) => (
              <div
                key={row.label}
                className={`px-8 py-4 border-b border-surface-border/60 flex justify-between items-center gap-4 ${(row as { wide?: boolean }).wide ? "sm:col-span-2" : ""}`}
              >
                <span className="text-[10px] tracking-[0.3em] uppercase text-gunmetal flex-shrink-0">
                  {row.label}
                </span>
                <span className="text-white text-sm text-right">
                  {String(row.value)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Contact / Lead capture ───────────────────────── */}
      <section ref={contactRef} className="max-w-6xl mx-auto px-8 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 border border-surface-border">
          <div className="bg-surface p-10 flex flex-col gap-8 border-b lg:border-b-0 lg:border-r border-surface-border">
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <div className="w-4 h-px bg-sulfur/60" />
                <p className="text-[9px] tracking-[0.4em] uppercase text-gunmetal">
                  Private Showing
                </p>
              </div>
              <h2
                style={{ fontFamily: "var(--font-playfair)" }}
                className="text-white text-3xl md:text-4xl font-normal leading-tight"
              >
                Schedule a Private Tour
              </h2>
            </div>
            <div className="flex flex-col gap-2">
              <p
                style={{ fontFamily: "var(--font-playfair)" }}
                className="text-sulfur text-2xl font-light"
              >
                {fmt(LISTING.price)}
              </p>
              <p className="text-white text-sm">{LISTING.address}</p>
              <p className="text-gunmetal text-sm">
                {LISTING.city}, {LISTING.state} {LISTING.zip}
              </p>
            </div>
            <div className="border-t border-surface-border pt-6 flex flex-col gap-3">
              <p className="text-[9px] tracking-[0.35em] uppercase text-gunmetal">
                Represented by
              </p>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-surface-raised border border-surface-border rounded-full flex items-center justify-center">
                  <span className="text-gunmetal text-sm font-light">
                    {LISTING.agentName
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </span>
                </div>
                <div>
                  <p className="text-white text-sm">{LISTING.agentName}</p>
                  <p className="text-gunmetal text-[10px] tracking-widest">
                    {LISTING.listingOfficeName}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[9px] tracking-[0.25em] uppercase text-gunmetal">
                  Agent ID
                </span>
                <span className="text-sulfur text-xs font-mono">
                  {LISTING.agentId}
                </span>
                <span className="text-gunmetal text-[10px]">·</span>
                <span className="border border-surface-border text-gunmetal text-[9px] tracking-widest px-2 py-0.5">
                  {LISTING.mlsName}
                </span>
              </div>
            </div>
          </div>
          <div className="p-10 flex flex-col gap-6">
            <ContactForm />
          </div>
        </div>
      </section>

      {/* ── Viewing Feedback ─────────────────────────────── */}
      <ViewingFeedback
        propertyAddress={`${LISTING.address}, ${LISTING.city}, ${LISTING.state} ${LISTING.zip}`}
        onNext={() =>
          portfolioRef.current?.scrollIntoView({ behavior: "smooth" })
        }
      />

      {/* ── Agent Portfolio ──────────────────────────────── */}
      <AgentPortfolio sectionRef={portfolioRef} />

      {/* ── IDX Compliance footer ────────────────────────── */}
      <div className="max-w-6xl mx-auto px-8 pb-8">
        <IDXFooter
          listingOfficeName={LISTING.listingOfficeName}
          mlsName={LISTING.mlsName}
        />
      </div>

      {/* ── Site footer ──────────────────────────────────── */}
      <footer className="border-t border-surface-border bg-obsidian-deep">
        <div className="max-w-6xl mx-auto px-8 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
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
            className="text-gunmetal text-[10px] tracking-widest uppercase hover:text-white transition-colors duration-200"
          >
            List Your Property →
          </Link>
        </div>
      </footer>
    </div>
  );
}

/* ── Viewing Feedback form ──────────────────────────────────── */

const RATING_OPTIONS = [
  "",
  "Poor",
  "Below Average",
  "Average",
  "Above Average",
  "Excellent",
];

const FEEDBACK_FIELDS = [
  { key: "cleanliness", label: "Cleanliness" },
  { key: "curbAppeal", label: "Curb Appeal" },
  { key: "landscaping", label: "Landscaping" },
  { key: "flooring", label: "Flooring" },
  { key: "paint", label: "Paint" },
  { key: "showability", label: "Showability" },
] as const;

type FeedbackKey = (typeof FEEDBACK_FIELDS)[number]["key"];

function ViewingFeedback({
  propertyAddress,
  onNext,
}: {
  propertyAddress: string;
  onNext: () => void;
}) {
  const [ratings, setRatings] = useState<Record<FeedbackKey, string>>({
    cleanliness: "",
    curbAppeal: "",
    landscaping: "",
    flooring: "",
    paint: "",
    showability: "",
  });
  const [suggestedPrice, setSuggestedPrice] = useState("");
  const [feedback, setFeedback] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function handleRating(key: FeedbackKey, value: string) {
    setRatings((r) => ({ ...r, [key]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
  }

  return (
    <section className="max-w-6xl mx-auto px-8 pb-20">
      {/* Section header */}
      <div className="border border-surface-border">
        <div className="border-b border-surface-border px-8 py-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <div className="w-4 h-px bg-sulfur/60" />
              <p className="text-[9px] tracking-[0.4em] uppercase text-gunmetal">
                Buyer Feedback
              </p>
            </div>
            <h2
              style={{ fontFamily: "var(--font-playfair)" }}
              className="text-white text-2xl md:text-3xl font-normal"
            >
              Property Viewing Feedback
            </h2>
          </div>
          <p className="text-gunmetal text-xs max-w-xs">
            Share your impressions after touring this property. Your feedback
            helps the agent serve you better.
          </p>
        </div>

        {submitted ? (
          <div className="flex flex-col items-center justify-center gap-6 py-20 text-center">
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
                Feedback Submitted
              </p>
              <p className="text-gunmetal text-sm">
                Thank you — your agent will review your notes.
              </p>
            </div>
            <button
              onClick={onNext}
              className="flex items-center gap-3 border border-sulfur/30 text-sulfur text-[9px] tracking-[0.35em] uppercase px-8 py-3 hover:bg-sulfur hover:text-obsidian transition-all duration-300"
            >
              View Next Property
              <svg width="12" height="10" viewBox="0 0 12 10" fill="none">
                <path
                  d="M1 5h10M7 1l4 4-4 4"
                  stroke="currentColor"
                  strokeWidth="1.25"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-8 flex flex-col gap-8">
            {/* Property — auto-filled, locked */}
            <div className="flex flex-col gap-1.5">
              <p className="text-[9px] tracking-[0.3em] uppercase text-gunmetal">
                Property
              </p>
              <div className="w-full bg-obsidian-deep border border-surface-border text-gunmetal text-sm px-4 py-2.5 flex items-center justify-between">
                <span className="text-white/70">{propertyAddress}</span>
                <span className="text-[9px] tracking-widest uppercase text-gunmetal ml-4 flex-shrink-0">
                  Auto-filled
                </span>
              </div>
            </div>

            {/* Rating dropdowns — 3-column grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {FEEDBACK_FIELDS.map(({ key, label }) => (
                <label key={key} className="flex flex-col gap-1.5">
                  <span className="text-[9px] tracking-[0.3em] uppercase text-gunmetal">
                    {label}
                  </span>
                  <div className="relative">
                    <select
                      value={ratings[key]}
                      onChange={(e) => handleRating(key, e.target.value)}
                      className="w-full appearance-none bg-obsidian-deep border border-surface-border text-sm px-4 py-2.5 pr-8 focus:outline-none focus:border-gunmetal transition-colors duration-200 cursor-pointer"
                      style={{ color: ratings[key] ? "white" : "#a0a4a6" }}
                    >
                      <option value="" disabled>
                        Select rating
                      </option>
                      {RATING_OPTIONS.slice(1).map((opt) => (
                        <option
                          key={opt}
                          value={opt}
                          style={{ backgroundColor: "#1a1a1a", color: "white" }}
                        >
                          {opt}
                        </option>
                      ))}
                    </select>
                    {/* Custom chevron */}
                    <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
                      <svg width="10" height="6" viewBox="0 0 10 6" fill="none">
                        <path
                          d="M1 1l4 4 4-4"
                          stroke="#a0a4a6"
                          strokeWidth="1.25"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                    {/* Rating badge */}
                    {ratings[key] && (
                      <div className="absolute right-8 top-1/2 -translate-y-1/2">
                        <RatingBadge value={ratings[key]} />
                      </div>
                    )}
                  </div>
                </label>
              ))}
            </div>

            {/* Suggested Price + Notes row */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
              <label className="lg:col-span-2 flex flex-col gap-1.5">
                <span className="text-[9px] tracking-[0.3em] uppercase text-gunmetal">
                  Suggested Price
                </span>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gunmetal text-sm select-none">
                    $
                  </span>
                  <input
                    type="text"
                    value={suggestedPrice}
                    onChange={(e) => {
                      // Allow only digits and commas
                      const raw = e.target.value.replace(/[^0-9]/g, "");
                      setSuggestedPrice(
                        raw ? Number(raw).toLocaleString() : "",
                      );
                    }}
                    placeholder="4,500,000"
                    className="w-full bg-obsidian-deep border border-surface-border text-white text-sm pl-8 pr-4 py-2.5 focus:outline-none focus:border-gunmetal placeholder:text-gunmetal transition-colors duration-200"
                  />
                </div>
              </label>
              <label className="lg:col-span-3 flex flex-col gap-1.5">
                <span className="text-[9px] tracking-[0.3em] uppercase text-gunmetal">
                  Additional Feedback
                </span>
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  rows={3}
                  placeholder="Share any additional thoughts about the property..."
                  className="w-full bg-obsidian-deep border border-surface-border text-white text-sm px-4 py-2.5 focus:outline-none focus:border-gunmetal placeholder:text-gunmetal resize-none transition-colors duration-200"
                  style={{
                    fontFamily: "var(--font-cormorant)",
                    fontSize: "1rem",
                  }}
                />
              </label>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-2 border-t border-surface-border">
              <p className="text-gunmetal text-[10px] leading-relaxed">
                Feedback is sent privately to your agent and is never shared
                publicly.
              </p>
              <div className="flex items-center gap-3 flex-shrink-0">
                <button
                  type="submit"
                  className="bg-cinnabar text-white px-8 py-3 text-[9px] tracking-[0.35em] uppercase font-medium hover:bg-cinnabar-dark transition-colors duration-300"
                >
                  Submit Feedback
                </button>
                <button
                  type="button"
                  onClick={onNext}
                  className="flex items-center gap-2.5 border border-sulfur/30 text-sulfur text-[9px] tracking-[0.35em] uppercase px-6 py-3 hover:bg-sulfur hover:text-obsidian transition-all duration-300"
                >
                  Next Property
                  <svg width="12" height="10" viewBox="0 0 12 10" fill="none">
                    <path
                      d="M1 5h10M7 1l4 4-4 4"
                      stroke="currentColor"
                      strokeWidth="1.25"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </section>
  );
}

function RatingBadge({ value }: { value: string }) {
  const colorMap: Record<string, string> = {
    Poor: "text-cinnabar",
    "Below Average": "text-cinnabar",
    Average: "text-gunmetal",
    "Above Average": "text-sulfur/70",
    Excellent: "text-sulfur",
  };
  return (
    <span
      className={`text-[8px] tracking-widest uppercase font-medium ${colorMap[value] ?? "text-gunmetal"}`}
    >
      {value === "Excellent"
        ? "✦"
        : value === "Above Average"
          ? "↑"
          : value === "Poor"
            ? "↓"
            : "·"}
    </span>
  );
}

/* ── Agent Portfolio ────────────────────────────────────────── */

function AgentPortfolio({
  sectionRef,
}: {
  sectionRef: React.RefObject<HTMLElement | null>;
}) {
  return (
    <section ref={sectionRef} className="max-w-6xl mx-auto px-8 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-surface-border pb-8 mb-10">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-4">
            <div className="w-6 h-px bg-sulfur" />
            <p className="text-[9px] tracking-[0.5em] uppercase text-gunmetal">
              More From This Agent
            </p>
          </div>
          <h2
            style={{ fontFamily: "var(--font-playfair)" }}
            className="text-white text-3xl font-normal"
          >
            Explore the Portfolio
          </h2>
        </div>
        <p className="text-gunmetal text-xs">
          {OTHER_LISTINGS.length} additional properties
        </p>
      </div>

      {/* Property cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {OTHER_LISTINGS.map((listing, i) => (
          <PortfolioCard key={i} listing={listing} />
        ))}
      </div>
    </section>
  );
}

function PortfolioCard({
  listing,
}: {
  listing: (typeof OTHER_LISTINGS)[number];
}) {
  return (
    <article className="card-luxury border border-surface-border flex flex-col overflow-hidden group cursor-pointer">
      {/* Image */}
      <div className="img-zoom overflow-hidden h-48 relative">
        <img
          src={listing.image}
          alt={listing.address}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-obsidian-deep/70 via-transparent to-transparent" />
        {/* Status badge */}
        <div className="absolute top-3 right-3">
          <span className="bg-sulfur text-obsidian text-[8px] tracking-[0.35em] uppercase px-2 py-1 font-semibold">
            {listing.status}
          </span>
        </div>
        {/* Price overlay */}
        <div className="absolute bottom-3 left-3">
          <p
            style={{ fontFamily: "var(--font-playfair)" }}
            className="text-white text-lg font-light"
          >
            {fmt(listing.price)}
          </p>
        </div>
      </div>

      {/* Details */}
      <div className="p-5 flex flex-col gap-3 flex-1">
        <div>
          <p className="text-white text-sm leading-snug">{listing.address}</p>
          <p className="text-gunmetal text-[10px] tracking-wide mt-0.5">
            {listing.city}, {listing.state} {listing.zip}
          </p>
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-3 text-[10px] text-gunmetal tracking-wide">
          <span>{listing.beds} Bed</span>
          <span className="text-surface-border">·</span>
          <span>{listing.baths} Bath</span>
          <span className="text-surface-border">·</span>
          <span>{listing.sqFt.toLocaleString()} SF</span>
        </div>

        {/* Property type chip */}
        <div className="mt-auto pt-3 border-t border-surface-border flex items-center justify-between">
          <span className="text-[9px] tracking-[0.3em] uppercase text-gunmetal">
            {listing.propType}
          </span>
          <span className="text-sulfur text-[9px] tracking-widest uppercase group-hover:translate-x-1 transition-transform duration-200">
            View →
          </span>
        </div>
      </div>
    </article>
  );
}

/* ── Contact form ───────────────────────────────────────────── */

function ContactForm() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
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
            Your agent will be in touch within 24 hours to confirm your private
            showing.
          </p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4">
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
      <FormField
        label="Phone"
        name="phone"
        type="tel"
        value={form.phone}
        onChange={handleChange}
        placeholder="(602) 555-0100"
      />
      <label className="flex flex-col gap-1.5">
        <span className="text-[9px] tracking-[0.3em] uppercase text-gunmetal">
          Message
        </span>
        <textarea
          name="message"
          value={form.message}
          onChange={handleChange}
          rows={4}
          placeholder="I'd love to schedule a showing at your earliest convenience..."
          className="w-full bg-obsidian-deep border border-surface-border text-white text-sm px-4 py-2.5 focus:outline-none focus:border-gunmetal placeholder:text-gunmetal resize-none transition-colors duration-200"
          style={{ fontFamily: "var(--font-cormorant)", fontSize: "1rem" }}
        />
      </label>
      <button
        type="submit"
        className="w-full bg-cinnabar text-white py-4 text-[9px] tracking-[0.4em] uppercase font-medium hover:bg-cinnabar-dark transition-colors duration-300 mt-2"
      >
        Request a Private Showing
      </button>
      <p className="text-gunmetal text-[10px] text-center leading-relaxed">
        By submitting, you agree to be contacted by the listing agent. Your
        information is never sold or shared.
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
        className="w-full bg-obsidian-deep border border-surface-border text-white text-sm px-4 py-2.5 focus:outline-none focus:border-gunmetal placeholder:text-gunmetal transition-colors duration-200"
      />
    </label>
  );
}
