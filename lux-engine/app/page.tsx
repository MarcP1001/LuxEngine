"use client";

import {
  Authenticated,
  Unauthenticated,
  useMutation,
  useQuery,
  useAction,
} from "convex/react";
import { SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "../convex/_generated/api";
import AgentIdForm from "@/components/AgentIdForm";
import AddListingModal from "@/components/AddListingModal";
import SortableListingGrid from "@/components/SortableListingGrid";
import ListingMap from "@/components/ListingMap";
import { Doc } from "../convex/_generated/dataModel";

export default function Home() {
  return (
    <div className="min-h-screen bg-obsidian-deep">
      <Header />
      <main>
        <Authenticated>
          <Dashboard />
        </Authenticated>
        <Unauthenticated>
          <LandingState />
        </Unauthenticated>
      </main>
    </div>
  );
}

function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-surface-border bg-obsidian-deep/95 backdrop-blur">
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
          <Authenticated>
            <AdminLink />
            {/* Brokerage icon */}
            <Link
              href="/brokerage"
              className="w-8 h-8 border border-surface-border text-gunmetal hover:border-gunmetal hover:text-white flex items-center justify-center transition-colors duration-200"
              aria-label="Brokerage"
              title="Brokerage"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path
                  d="M2 12V6l5-4.5L12 6v6H2z"
                  stroke="currentColor"
                  strokeWidth="1.25"
                  strokeLinejoin="round"
                />
                <path
                  d="M5.5 12V9h3v3"
                  stroke="currentColor"
                  strokeWidth="1.25"
                  strokeLinejoin="round"
                />
              </svg>
            </Link>
            {/* Settings icon */}
            <Link
              href="/settings"
              className="w-8 h-8 border border-surface-border text-gunmetal hover:border-gunmetal hover:text-white flex items-center justify-center transition-colors duration-200"
              aria-label="Settings"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <circle
                  cx="7"
                  cy="7"
                  r="2"
                  stroke="currentColor"
                  strokeWidth="1.25"
                />
                <path
                  d="M7 1v1.5M7 11.5V13M1 7h1.5M11.5 7H13M2.93 2.93l1.06 1.06M10.01 10.01l1.06 1.06M2.93 11.07l1.06-1.06M10.01 3.99l1.06-1.06"
                  stroke="currentColor"
                  strokeWidth="1.25"
                  strokeLinecap="round"
                />
              </svg>
            </Link>
            <UserButton />
          </Authenticated>
          <Unauthenticated>
            <SignInButton mode="modal">
              <button className="border border-sulfur/40 text-sulfur text-[9px] tracking-[0.35em] uppercase px-5 py-2 hover:bg-sulfur hover:text-obsidian transition-all duration-300">
                Sign In
              </button>
            </SignInButton>
          </Unauthenticated>
        </div>
      </div>
    </header>
  );
}

function LandingState() {
  return (
    <div className="max-w-7xl mx-auto px-8">
      {/* Hero */}
      <div className="flex flex-col items-start justify-center min-h-[85vh] gap-10 max-w-3xl">
        <div className="flex items-center gap-4">
          <div className="w-8 h-px bg-sulfur" />
          <p className="text-[9px] tracking-[0.5em] uppercase text-gunmetal">
            Real Estate Marketing Platform
          </p>
        </div>

        <div className="flex flex-col gap-6">
          <h1
            style={{ fontFamily: "var(--font-playfair)" }}
            className="text-6xl md:text-8xl font-normal leading-none text-white"
          >
            Your Listings.
            <br />
            <span className="text-sulfur italic">Elevated.</span>
          </h1>

          <p className="text-gunmetal text-base leading-relaxed max-w-lg">
            From MLS data to a live luxury property website in under two
            minutes. No IDX subscription required. AI-generated copy. Hosted and
            managed for you.
          </p>
        </div>

        <div className="flex flex-wrap gap-4">
          <SignUpButton mode="modal">
            <button className="bg-cinnabar text-white px-10 py-4 text-[10px] tracking-[0.4em] uppercase font-medium hover:bg-cinnabar-dark transition-colors duration-300">
              Get Started — $1,200 / yr
            </button>
          </SignUpButton>
          <SignInButton mode="modal">
            <button className="border border-surface-border text-gunmetal px-10 py-4 text-[10px] tracking-[0.4em] uppercase hover:border-gunmetal-light hover:text-white transition-colors duration-300">
              Sign In
            </button>
          </SignInButton>
        </div>

        {/* Feature strip */}
        <div className="flex flex-wrap gap-8 pt-6 border-t border-surface-border w-full">
          {[
            {
              mark: "01",
              label: "IDX Data Included",
              sub: "No separate subscription",
            },
            {
              mark: "02",
              label: "AI Copy — 3 Styles",
              sub: "Romantic · Investor · Family",
            },
            {
              mark: "03",
              label: "Live in < 2 Min",
              sub: "Enter ID, click Launch",
            },
          ].map((f) => (
            <div key={f.mark} className="flex flex-col gap-1.5">
              <p className="text-[9px] tracking-[0.4em] uppercase text-gunmetal">
                {f.mark}
              </p>
              <p className="text-white text-sm tracking-wide">{f.label}</p>
              <p className="text-gunmetal text-xs">{f.sub}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Dashboard() {
  const getOrCreate = useMutation(api.users.getOrCreateUser);
  const profile = useQuery(api.users.getMyProfile);
  const listings = useQuery(api.listings.getMyListings);
  const leads = useQuery(api.leads.getMyLeads);
  const syncListings = useAction(api.listings.syncListings);
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const totalValue = listings?.reduce((s, l) => s + l.price, 0) ?? 0;
  const liveCount =
    listings?.filter((l) => l.siteStatus === "published").length ?? 0;

  useEffect(() => {
    void getOrCreate();
  }, [getOrCreate]);

  if (profile === undefined) return <LoadingState />;
  if (!profile?.onboardingComplete) return <AgentIdForm />;

  async function handleSync() {
    if (!profile?.agentId || !profile?.mlsName) return;
    setSyncing(true);
    setSyncError(null);
    try {
      await syncListings({
        agentId: profile.agentId,
        mlsName: profile.mlsName,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Sync failed";
      setSyncError(
        msg === "NO_KEY"
          ? "IDX key not yet configured — sync available once the key is added."
          : msg,
      );
    } finally {
      setSyncing(false);
    }
  }

  return (
    <>
      {showAddModal && (
        <AddListingModal onClose={() => setShowAddModal(false)} />
      )}
      <div className="max-w-7xl mx-auto px-8 py-12 flex flex-col gap-12">
        {/* Stats bar */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 border-b border-surface-border pb-8">
          <div className="flex flex-wrap gap-10">
            <div>
              <p className="text-[9px] tracking-[0.4em] uppercase text-gunmetal mb-1">
                Active Listings
              </p>
              <p
                style={{ fontFamily: "var(--font-playfair)" }}
                className="text-white text-3xl font-light"
              >
                {listings?.length ?? 0}
              </p>
            </div>
            {totalValue > 0 && (
              <div>
                <p className="text-[9px] tracking-[0.4em] uppercase text-gunmetal mb-1">
                  Portfolio Value
                </p>
                <p
                  style={{ fontFamily: "var(--font-playfair)" }}
                  className="text-sulfur text-3xl font-light"
                >
                  ${(totalValue / 1_000_000).toFixed(1)}M
                </p>
              </div>
            )}
            <div>
              <p className="text-[9px] tracking-[0.4em] uppercase text-gunmetal mb-1">
                Live Sites
              </p>
              <p
                style={{ fontFamily: "var(--font-playfair)" }}
                className="text-white text-3xl font-light"
              >
                {liveCount}
              </p>
            </div>
            <div>
              <p className="text-[9px] tracking-[0.4em] uppercase text-gunmetal mb-1">
                Leads
              </p>
              <p
                style={{ fontFamily: "var(--font-playfair)" }}
                className="text-sulfur text-3xl font-light"
              >
                {leads?.length ?? 0}
              </p>
            </div>
            {profile.agentId && (
              <div>
                <p className="text-[9px] tracking-[0.4em] uppercase text-gunmetal mb-1">
                  Agent ID
                </p>
                <p className="text-sulfur text-sm tracking-widest font-mono">
                  {profile.agentId}
                </p>
              </div>
            )}
          </div>

          <div className="flex flex-col items-end gap-2">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2.5 border border-surface-border text-gunmetal px-5 py-2 text-[9px] tracking-[0.35em] uppercase hover:border-gunmetal hover:text-white transition-all duration-300"
              >
                <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none">
                  <path
                    d="M6 1v10M1 6h10"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
                Add Listing
              </button>
              <button
                onClick={handleSync}
                disabled={syncing}
                className="group flex items-center gap-2.5 border border-sulfur/30 text-sulfur px-5 py-2 text-[9px] tracking-[0.35em] uppercase hover:bg-sulfur hover:text-obsidian transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed"
              >
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
                {syncing ? "Syncing..." : "Sync Listings"}
              </button>
            </div>
            {syncError && (
              <p className="text-cinnabar text-[10px] max-w-xs text-right">
                {syncError}
              </p>
            )}
          </div>
        </div>

        {/* Section label */}
        <div className="flex items-center gap-4">
          <div className="w-6 h-px bg-sulfur" />
          <p className="text-[9px] tracking-[0.5em] uppercase text-gunmetal">
            Your Inventory
          </p>
        </div>

        {/* Listing grid */}
        {listings === undefined ? (
          <LoadingState />
        ) : listings.length === 0 ? (
          <EmptyInventory
            onSync={handleSync}
            syncing={syncing}
            onAddManual={() => setShowAddModal(true)}
          />
        ) : (
          <SortableListingGrid listings={listings} />
        )}

        {/* Map & Route Planner */}
        {listings && listings.length > 0 && (
          <div className="flex flex-col gap-6 border-t border-surface-border pt-12">
            <div className="flex items-center gap-4">
              <div className="w-6 h-px bg-sulfur" />
              <p className="text-[9px] tracking-[0.5em] uppercase text-gunmetal">
                Map & Route Planner
              </p>
            </div>
            <ListingMap listings={listings} />
          </div>
        )}

        {/* Recent Leads */}
        <div className="flex flex-col gap-6 border-t border-surface-border pt-12">
          <div className="flex items-center gap-4">
            <div className="w-6 h-px bg-sulfur" />
            <p className="text-[9px] tracking-[0.5em] uppercase text-gunmetal">
              Recent Leads
            </p>
          </div>
          {!leads || leads.length === 0 ? (
            <p className="text-gunmetal text-sm">
              No leads yet. Share your property links to start receiving
              inquiries.
            </p>
          ) : (
            <div className="border border-surface-border">
              {leads.map((lead, i) => (
                <LeadRow
                  key={lead._id}
                  lead={lead}
                  isLast={i === leads.length - 1}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

type LeadStatus = "new" | "contacted" | "archived";

const LEAD_STATUS_STYLES: Record<
  LeadStatus,
  { label: string; classes: string }
> = {
  new: { label: "New", classes: "bg-sulfur text-obsidian" },
  contacted: {
    label: "Contacted",
    classes: "bg-surface text-gunmetal border border-gunmetal",
  },
  archived: {
    label: "Archived",
    classes: "bg-surface text-gunmetal border border-surface-border",
  },
};

const LEAD_STATUS_CYCLE: Record<LeadStatus, LeadStatus> = {
  new: "contacted",
  contacted: "archived",
  archived: "new",
};

function LeadRow({ lead, isLast }: { lead: Doc<"leads">; isLast: boolean }) {
  const updateStatus = useMutation(api.leads.updateLeadStatus);
  const status: LeadStatus =
    lead.status === "contacted" || lead.status === "archived"
      ? lead.status
      : "new";
  const style = LEAD_STATUS_STYLES[status];

  return (
    <div
      className={`grid grid-cols-1 sm:grid-cols-[auto_1fr_1fr_1fr_auto] gap-x-6 gap-y-1 px-6 py-4 items-center ${
        !isLast ? "border-b border-surface-border/60" : ""
      }`}
    >
      <button
        onClick={() =>
          updateStatus({ leadId: lead._id, status: LEAD_STATUS_CYCLE[status] })
        }
        className={`px-2.5 py-1 text-[8px] tracking-[0.25em] uppercase font-medium whitespace-nowrap ${style.classes} hover:opacity-80 transition-opacity`}
        title={`Click to mark as ${LEAD_STATUS_CYCLE[status]}`}
      >
        {style.label}
      </button>
      <div className="flex flex-col gap-0.5">
        <p className="text-white text-sm">{lead.name}</p>
        <a
          href={`mailto:${lead.email}`}
          className="text-sulfur text-[11px] hover:underline"
        >
          {lead.email}
        </a>
        {lead.phone && (
          <p className="text-gunmetal text-[11px]">{lead.phone}</p>
        )}
      </div>
      <div className="flex flex-col justify-center">
        <p className="text-gunmetal text-[10px] tracking-[0.2em] uppercase">
          Property
        </p>
        <p className="text-white text-sm truncate">{lead.address}</p>
      </div>
      {lead.message ? (
        <p className="text-gunmetal text-[11px] leading-relaxed line-clamp-2 self-center">
          {lead.message}
        </p>
      ) : (
        <div />
      )}
      <p className="text-gunmetal text-[10px] self-center whitespace-nowrap">
        {new Date(lead.submittedAt).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })}
      </p>
    </div>
  );
}

function EmptyInventory({
  onSync,
  syncing,
  onAddManual,
}: {
  onSync: () => void;
  syncing: boolean;
  onAddManual: () => void;
}) {
  const seedDemo = useMutation(api.listings.seedDemoListings);
  const [seeding, setSeeding] = useState(false);

  async function handleSeed() {
    setSeeding(true);
    try {
      await seedDemo();
    } finally {
      setSeeding(false);
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-8 text-center py-20">
      <div className="flex flex-col items-center gap-3">
        <div className="w-px h-16 bg-gradient-to-b from-transparent to-sulfur/40" />
        <div className="w-8 h-8 border border-sulfur/30 flex items-center justify-center">
          <span className="text-sulfur text-base">∅</span>
        </div>
      </div>
      <div>
        <p className="text-[9px] tracking-[0.5em] uppercase text-gunmetal mb-3">
          No Listings Yet
        </p>
        <h3
          style={{ fontFamily: "var(--font-playfair)" }}
          className="text-white text-3xl font-light"
        >
          Ready when you are.
        </h3>
        <p className="text-gunmetal text-sm mt-3 max-w-sm">
          Sync your MLS inventory, add a listing manually, or load demo
          properties to get started.
        </p>
      </div>

      <div className="flex flex-wrap justify-center gap-3">
        <button
          onClick={onSync}
          disabled={syncing}
          className="bg-cinnabar text-white px-8 py-3.5 text-[9px] tracking-[0.4em] uppercase font-medium hover:bg-cinnabar-dark transition-colors duration-300 disabled:opacity-30"
        >
          {syncing ? "Syncing..." : "Sync MLS Listings"}
        </button>
        <button
          onClick={onAddManual}
          className="border border-surface-border text-gunmetal px-8 py-3.5 text-[9px] tracking-[0.4em] uppercase hover:border-gunmetal hover:text-white transition-colors duration-300"
        >
          + Add Manually
        </button>
        <button
          onClick={handleSeed}
          disabled={seeding}
          className="border border-sulfur/20 text-sulfur/60 px-8 py-3.5 text-[9px] tracking-[0.4em] uppercase hover:border-sulfur/40 hover:text-sulfur transition-colors duration-300 disabled:opacity-30"
        >
          {seeding ? "Loading..." : "Load Demo Listings"}
        </button>
      </div>
    </div>
  );
}

function AdminLink() {
  const isAdmin = useQuery(api.admin.isSuperadmin);
  if (!isAdmin) return null;
  return (
    <Link
      href="/admin"
      className="w-8 h-8 border border-cinnabar/30 text-cinnabar hover:border-cinnabar hover:text-white flex items-center justify-center transition-colors duration-200"
      aria-label="Admin"
      title="Superadmin"
    >
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <path
          d="M7 1l1.5 3 3.5.5-2.5 2.5.5 3.5L7 9l-3 1.5.5-3.5L2 4.5 5.5 4z"
          stroke="currentColor"
          strokeWidth="1.25"
          strokeLinejoin="round"
        />
      </svg>
    </Link>
  );
}

function LoadingState() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-5">
        <div className="w-10 h-10 border border-surface-border border-t-sulfur/60 rounded-full animate-spin" />
        <p className="text-[9px] tracking-[0.5em] uppercase text-gunmetal">
          Loading
        </p>
      </div>
    </div>
  );
}
