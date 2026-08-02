"use client";

import { useState } from "react";
import { useMutation, useAction, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { Doc } from "../convex/_generated/dataModel";
import IDXFooter from "./IDXFooter";
import { useGenerateFlyer } from "./FlyerGenerator";
import { useGenerateSocialPreview } from "./SocialPreview";

type Listing = Doc<"listings">;
type Narrative = "romantic" | "investor" | "family";

const NARRATIVE_LABELS: Record<Narrative, string> = {
  romantic: "The Romantic",
  investor: "The Investor",
  family: "The Family",
};

export default function ListingCard({ listing }: { listing: Listing }) {
  const [expanded, setExpanded] = useState(false);
  const [activeNarrative, setActiveNarrative] = useState<Narrative>("romantic");
  const [enhancing, setEnhancing] = useState(false);
  const [launching, setLaunching] = useState(false);
  const [enhanceError, setEnhanceError] = useState<string | null>(null);

  const site = useQuery(api.sites.getSiteByListingId, {
    listingId: listing.listingId,
  });
  const enhanceListing = useAction(api.ai.enhanceListing);
  const launchSite = useMutation(api.sites.launchSite);
  const takeOffline = useMutation(api.sites.takeOffline);
  const generateFlyer = useGenerateFlyer();
  const { generate: generateSocial, generating: generatingSocial } =
    useGenerateSocialPreview();

  const heroImage = listing.images[0] ?? null;
  const hasAI = !!(
    listing.aiRomantic &&
    listing.aiInvestor &&
    listing.aiFamily
  );
  const isLive = site?.status === "live";

  function makeSubdomain(address: string): string {
    return address
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "")
      .slice(0, 30);
  }

  async function handleEnhance() {
    if (!listing.publicRemarks) {
      setEnhanceError("No MLS description available.");
      return;
    }
    setEnhancing(true);
    setEnhanceError(null);
    try {
      await enhanceListing({ listingId: listing._id });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "AI enhancement failed";
      setEnhanceError(
        msg.includes("GEMINI") || msg.includes("API key")
          ? "AI key not configured — ask your admin to set GEMINI_API_KEY."
          : msg,
      );
    } finally {
      setEnhancing(false);
    }
  }

  async function handleLaunch() {
    setLaunching(true);
    try {
      if (!hasAI && listing.publicRemarks) await handleEnhance();
      await launchSite({
        listingId: listing.listingId,
        subdomain: makeSubdomain(listing.address),
        activeNarrative,
      });
    } finally {
      setLaunching(false);
    }
  }

  const narrativeText: Record<Narrative, string | undefined> = {
    romantic: listing.aiRomantic,
    investor: listing.aiInvestor,
    family: listing.aiFamily,
  };

  return (
    <article className="card-luxury group border border-surface-border bg-surface flex flex-col overflow-hidden">
      {/* Hero image */}
      <div
        className="img-zoom relative flex-shrink-0"
        style={{ height: "280px" }}
      >
        {heroImage ? (
          <img
            src={heroImage}
            alt={listing.address}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        ) : (
          <div className="w-full h-full bg-obsidian-deep flex items-center justify-center">
            <span className="text-gunmetal text-xs tracking-[0.3em] uppercase">
              No Image
            </span>
          </div>
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/10 to-transparent" />

        {/* Top badges */}
        <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
          {listing.propType && (
            <span className="text-[9px] tracking-[0.3em] uppercase text-white/50 bg-obsidian/70 backdrop-blur-sm px-2.5 py-1 border border-white/10">
              {listing.propType}
            </span>
          )}
          <span
            className={`ml-auto text-[9px] tracking-[0.3em] uppercase px-2.5 py-1 font-medium ${
              isLive
                ? "bg-sulfur text-obsidian"
                : "bg-obsidian/80 backdrop-blur-sm text-gunmetal border border-gunmetal"
            }`}
          >
            {isLive ? "Live" : "Draft"}
          </span>
        </div>
      </div>

      {/* Card body */}
      <div className="flex flex-col flex-1 p-6 gap-4">
        {/* Location label */}
        <p className="text-gunmetal text-[9px] tracking-[0.4em] uppercase">
          {listing.city} — {listing.state}
        </p>

        {/* Address */}
        <h3
          style={{ fontFamily: "var(--font-playfair)" }}
          className="text-white text-xl leading-snug group-hover:text-cream transition-colors duration-300 font-normal"
        >
          {listing.address}
        </h3>

        {/* Price */}
        <p
          style={{ fontFamily: "var(--font-playfair)" }}
          className="text-sulfur text-2xl font-light tracking-wide"
        >
          ${listing.price.toLocaleString()}
        </p>

        {/* Stats */}
        <div className="flex items-center gap-2.5 text-gunmetal text-[10px] tracking-[0.2em] uppercase">
          {listing.beds !== undefined && <span>{listing.beds} Bed</span>}
          {listing.beds !== undefined && listing.baths !== undefined && (
            <span className="text-gunmetal">—</span>
          )}
          {listing.baths !== undefined && <span>{listing.baths} Bath</span>}
          {listing.sqFt !== undefined && (
            <span className="text-gunmetal">—</span>
          )}
          {listing.sqFt !== undefined && (
            <span>{listing.sqFt.toLocaleString()} SF</span>
          )}
        </div>

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-surface-border to-transparent" />

        {/* Expanded AI section */}
        {expanded && (
          <div className="flex flex-col gap-4">
            {hasAI ? (
              <>
                {/* Narrative tabs */}
                <div className="flex border border-surface-border">
                  {(Object.keys(NARRATIVE_LABELS) as Narrative[]).map((n) => (
                    <button
                      key={n}
                      onClick={() => setActiveNarrative(n)}
                      className={`flex-1 py-2 text-[9px] tracking-[0.25em] uppercase transition-colors duration-200 ${
                        activeNarrative === n
                          ? "bg-sulfur text-obsidian font-semibold"
                          : "text-gunmetal hover:text-white"
                      }`}
                    >
                      {NARRATIVE_LABELS[n].replace("The ", "")}
                    </button>
                  ))}
                </div>

                {/* AI copy */}
                <p
                  style={{ fontFamily: "var(--font-cormorant)" }}
                  className="text-white/75 text-base leading-relaxed font-light italic"
                >
                  {narrativeText[activeNarrative]}
                </p>
              </>
            ) : (
              <div className="flex flex-col gap-3">
                <p className="text-gunmetal text-xs tracking-wide">
                  Generate three marketing narratives powered by AI.
                </p>
                {enhanceError && (
                  <p className="text-cinnabar text-xs">{enhanceError}</p>
                )}
                <button
                  onClick={handleEnhance}
                  disabled={enhancing || !listing.publicRemarks}
                  className="border border-gunmetal text-gunmetal py-2.5 text-[9px] tracking-[0.3em] uppercase hover:border-sulfur hover:text-sulfur transition-colors duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  {enhancing ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-3 h-3 border border-gunmetal border-t-sulfur rounded-full animate-spin" />
                      Generating...
                    </span>
                  ) : listing.publicRemarks ? (
                    "✦  Generate AI Narratives"
                  ) : (
                    "No MLS Description Available"
                  )}
                </button>
              </div>
            )}

            <IDXFooter
              listingOfficeName={listing.listingOfficeName}
              mlsName={listing.mlsName}
            />

            {isLive && site && (
              <button
                onClick={() => {
                  if (confirm("Take this site offline?"))
                    void takeOffline({ siteId: site._id });
                }}
                className="self-start text-gunmetal text-[9px] tracking-[0.2em] uppercase hover:text-cinnabar transition-colors"
              >
                Take Offline
              </button>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 mt-auto">
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex-1 py-2.5 border border-surface-border text-gunmetal text-[9px] tracking-[0.3em] uppercase hover:border-gunmetal hover:text-white transition-colors duration-300"
          >
            {expanded ? "Close" : "Preview"}
          </button>
          {isLive && (
            <button
              onClick={() =>
                generateFlyer({
                  address: listing.address,
                  city: listing.city,
                  state: listing.state,
                  zip: listing.zip,
                  price: listing.price,
                  beds: listing.beds,
                  baths: listing.baths,
                  sqFt: listing.sqFt,
                  heroImage: heroImage ?? undefined,
                  subdomain: site?.subdomain ?? makeSubdomain(listing.address),
                  narrative: narrativeText[activeNarrative],
                  listingOfficeName: listing.listingOfficeName,
                  mlsName: listing.mlsName,
                  agentId: listing.agentId,
                })
              }
              className="py-2.5 px-4 border border-surface-border text-gunmetal text-[9px] tracking-[0.3em] uppercase hover:border-gunmetal hover:text-white transition-colors duration-300"
              title="Download print-ready PDF flyer with QR code"
            >
              Flyer
            </button>
          )}
          {isLive && (
            <button
              onClick={() =>
                generateSocial({
                  address: listing.address,
                  city: listing.city,
                  state: listing.state,
                  zip: listing.zip,
                  price: listing.price,
                  beds: listing.beds,
                  baths: listing.baths,
                  sqFt: listing.sqFt,
                  heroImage: heroImage ?? undefined,
                  subdomain: site?.subdomain ?? makeSubdomain(listing.address),
                  narrative: narrativeText[activeNarrative],
                })
              }
              disabled={generatingSocial}
              className="py-2.5 px-4 border border-surface-border text-gunmetal text-[9px] tracking-[0.3em] uppercase hover:border-gunmetal hover:text-white transition-colors duration-300 disabled:opacity-50"
              title="Download 1200x630 social media preview image"
            >
              {generatingSocial ? "..." : "Social"}
            </button>
          )}
          <button
            onClick={
              isLive
                ? () =>
                    window.open(
                      `/sites/${site?.subdomain ?? makeSubdomain(listing.address)}`,
                      "_blank",
                    )
                : handleLaunch
            }
            disabled={launching}
            className={`flex-1 py-2.5 text-[9px] tracking-[0.3em] uppercase font-medium transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed ${
              isLive
                ? "border border-sulfur/50 text-sulfur hover:bg-sulfur hover:text-obsidian"
                : "bg-cinnabar text-white hover:bg-cinnabar-dark"
            }`}
          >
            {launching ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" />
                Launching...
              </span>
            ) : isLive ? (
              "↗  View Site"
            ) : (
              "Launch Site"
            )}
          </button>
        </div>
      </div>
    </article>
  );
}
