"use client";

import { useState } from "react";
import { useQuery, useMutation, useAction } from "convex/react";
import { Authenticated, Unauthenticated } from "convex/react";
import { SignInButton, UserButton } from "@clerk/nextjs";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import Link from "next/link";

export default function BrokeragePage() {
  return (
    <div className="min-h-screen bg-obsidian-deep">
      <BrokerageHeader />
      <main>
        <Authenticated>
          <BrokerageContent />
        </Authenticated>
        <Unauthenticated>
          <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
            <p className="text-gunmetal text-[9px] tracking-[0.4em] uppercase">
              Authentication Required
            </p>
            <SignInButton mode="modal">
              <button className="border border-sulfur/40 text-sulfur text-[9px] tracking-[0.35em] uppercase px-8 py-3 hover:bg-sulfur hover:text-obsidian transition-all duration-300">
                Sign In
              </button>
            </SignInButton>
          </div>
        </Unauthenticated>
      </main>
    </div>
  );
}

function BrokerageHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-surface-border bg-obsidian-deep/95 backdrop-blur">
      <div className="max-w-6xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-5">
          <Link
            href="/"
            className="text-gunmetal hover:text-white transition-colors"
            aria-label="Back to dashboard"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M10 2L4 8l6 6"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Link>
          <span className="w-px h-4 bg-surface-border" />
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
            Brokerage
          </span>
        </div>
        <Authenticated>
          <UserButton />
        </Authenticated>
      </div>
    </header>
  );
}

function BrokerageContent() {
  const brokerage = useQuery(api.brokerages.getMyBrokerage);

  if (brokerage === undefined) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border border-surface-border border-t-sulfur/60 rounded-full animate-spin" />
      </div>
    );
  }

  if (!brokerage) {
    return <CreateBrokerageForm />;
  }

  return <BrokerageDashboard />;
}

/* ── Create Brokerage ──────────────────────────────────────── */

function CreateBrokerageForm() {
  const createBrokerage = useMutation(api.brokerages.createBrokerage);
  const [name, setName] = useState("");
  const [mlsName, setMlsName] = useState("ARMLS");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const MLS_OPTIONS = ["ARMLS", "CRMLS", "NTREIS", "FMLS", "MRED", "Other"];

  async function handleCreate() {
    if (!name.trim()) {
      setError("Brokerage name is required.");
      return;
    }
    setCreating(true);
    setError(null);
    try {
      await createBrokerage({ name: name.trim(), mlsName });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="max-w-lg mx-auto px-8 py-24 flex flex-col gap-12">
      <div className="flex flex-col gap-4 text-center">
        <div className="flex items-center justify-center gap-3">
          <div className="w-6 h-px bg-sulfur" />
          <p className="text-[9px] tracking-[0.5em] uppercase text-gunmetal">
            Whitelabel
          </p>
          <div className="w-6 h-px bg-sulfur" />
        </div>
        <h1
          style={{ fontFamily: "var(--font-playfair)" }}
          className="text-white text-4xl font-normal"
        >
          Create Your Brokerage
        </h1>
        <p className="text-gunmetal text-sm max-w-sm mx-auto">
          Manage all your agents from one dashboard. Add their MLS Agent IDs and
          Lux Engine handles the rest.
        </p>
      </div>

      <div className="flex flex-col gap-6 border border-surface-border p-8">
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="brokerage-name"
            className="text-[9px] tracking-[0.3em] uppercase text-gunmetal"
          >
            Brokerage Name
          </label>
          <input
            id="brokerage-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Russ Lyon Sotheby's"
            className="w-full bg-obsidian-deep border border-surface-border text-white text-sm px-4 py-2.5 focus:outline-none focus:border-gunmetal placeholder:text-gunmetal transition-colors"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="default-mls-board"
            className="text-[9px] tracking-[0.3em] uppercase text-gunmetal"
          >
            Default MLS Board
          </label>
          <select
            id="default-mls-board"
            value={mlsName}
            onChange={(e) => setMlsName(e.target.value)}
            className="w-full bg-obsidian-deep border border-surface-border text-white text-sm px-4 py-2.5 focus:outline-none focus:border-gunmetal transition-colors cursor-pointer appearance-none"
          >
            {MLS_OPTIONS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>

        {error && (
          <p
            role="alert"
            className="text-cinnabar text-xs border border-cinnabar/30 bg-cinnabar/5 px-3 py-2"
          >
            {error}
          </p>
        )}

        <button
          onClick={handleCreate}
          disabled={creating}
          className="w-full bg-cinnabar text-white py-3 text-[9px] tracking-[0.4em] uppercase font-medium hover:bg-cinnabar-dark transition-colors disabled:opacity-40"
        >
          {creating ? "Creating..." : "Create Brokerage"}
        </button>
      </div>
    </div>
  );
}

/* ── Dashboard ─────────────────────────────────────────────── */

function BrokerageDashboard() {
  const brokerage = useQuery(api.brokerages.getMyBrokerage);
  const stats = useQuery(api.brokerages.getBrokerageStats);
  const agents = useQuery(api.brokerages.getAgents);
  const listings = useQuery(api.brokerages.getBrokerageListings);
  const leads = useQuery(api.brokerages.getBrokerageLeads);

  const [activeTab, setActiveTab] = useState<
    "agents" | "listings" | "leads" | "branding"
  >("agents");

  if (!brokerage || !stats) return null;

  const fmt = (n: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(n);

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-8 py-8 md:py-16 flex flex-col gap-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-4">
            <div className="w-6 h-px bg-sulfur" />
            <p className="text-[9px] tracking-[0.5em] uppercase text-gunmetal">
              Brokerage Dashboard
            </p>
          </div>
          <h1
            style={{ fontFamily: "var(--font-playfair)" }}
            className="text-white text-3xl md:text-4xl font-normal"
          >
            {brokerage.name}
          </h1>
        </div>
        {brokerage.logoUrl && (
          <img
            src={brokerage.logoUrl}
            alt={brokerage.name}
            className="h-10 object-contain opacity-60"
          />
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: "Agents", value: stats.agentCount },
          { label: "Listings", value: stats.totalListings },
          { label: "Live Sites", value: stats.liveSites },
          { label: "Leads", value: stats.totalLeads },
          { label: "Portfolio", value: fmt(stats.portfolioValue) },
        ].map((s) => (
          <div
            key={s.label}
            className="border border-surface-border bg-surface p-4 flex flex-col gap-1"
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
        ))}
      </div>

      {/* Tabs */}
      <div className="border-b border-surface-border flex gap-0">
        {(["agents", "listings", "leads", "branding"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 md:px-6 py-3 text-[9px] tracking-[0.3em] uppercase transition-colors border-b-2 -mb-px ${
              activeTab === tab
                ? "text-sulfur border-sulfur"
                : "text-gunmetal border-transparent hover:text-white"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "agents" && <AgentsTab agents={agents ?? []} />}
      {activeTab === "listings" && <ListingsTab listings={listings ?? []} />}
      {activeTab === "leads" && <LeadsTab leads={leads ?? []} />}
      {activeTab === "branding" && <BrandingTab brokerage={brokerage} />}
    </div>
  );
}

/* ── Agents Tab ────────────────────────────────────────────── */

type AgentUser = {
  _id: Id<"users">;
  email?: string;
  agentId?: string;
  mlsName?: string;
  clerkId: string;
  onboardingComplete: boolean;
};

function AgentsTab({ agents }: { agents: AgentUser[] }) {
  const addAgent = useMutation(api.brokerages.addAgent);
  const removeAgent = useMutation(api.brokerages.removeAgent);
  const syncAll = useAction(api.brokerages.syncAllAgents);

  const [showAdd, setShowAdd] = useState(false);
  const [email, setEmail] = useState("");
  const [agentId, setAgentId] = useState("");
  const [adding, setAdding] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null);

  async function handleAdd() {
    if (!email.trim() || !agentId.trim()) {
      setError("Email and Agent ID are required.");
      return;
    }
    setAdding(true);
    setError(null);
    try {
      await addAgent({ email: email.trim(), agentId: agentId.trim() });
      setEmail("");
      setAgentId("");
      setShowAdd(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add agent");
    } finally {
      setAdding(false);
    }
  }

  async function handleSync() {
    setSyncing(true);
    try {
      await syncAll();
    } finally {
      setSyncing(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <p className="text-gunmetal text-xs">
          {agents.length} agent{agents.length !== 1 ? "s" : ""} in your
          brokerage
        </p>
        <div className="flex items-center gap-3">
          <button
            onClick={handleSync}
            disabled={syncing}
            className="border border-surface-border text-gunmetal text-[9px] tracking-[0.3em] uppercase px-4 py-2 hover:border-gunmetal hover:text-white transition-colors disabled:opacity-50"
          >
            {syncing ? "Syncing..." : "Sync All"}
          </button>
          <button
            onClick={() => setShowAdd(!showAdd)}
            className="bg-cinnabar text-white text-[9px] tracking-[0.3em] uppercase px-4 py-2 hover:bg-cinnabar-dark transition-colors"
          >
            + Add Agent
          </button>
        </div>
      </div>

      {showAdd && (
        <div className="border border-surface-border p-6 flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="new-agent-email"
                className="text-[9px] tracking-[0.3em] uppercase text-gunmetal"
              >
                Agent Email
              </label>
              <input
                id="new-agent-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="agent@example.com"
                className="w-full bg-obsidian-deep border border-surface-border text-white text-sm px-4 py-2.5 focus:outline-none focus:border-gunmetal placeholder:text-gunmetal"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="new-agent-mls-id"
                className="text-[9px] tracking-[0.3em] uppercase text-gunmetal"
              >
                MLS Agent ID
              </label>
              <input
                id="new-agent-mls-id"
                type="text"
                value={agentId}
                onChange={(e) => setAgentId(e.target.value)}
                placeholder="e.g. SA654321"
                className="w-full bg-obsidian-deep border border-surface-border text-white text-sm px-4 py-2.5 focus:outline-none focus:border-gunmetal placeholder:text-gunmetal"
              />
            </div>
          </div>
          {error && (
            <p role="alert" className="text-cinnabar text-xs">
              {error}
            </p>
          )}
          <div className="flex items-center gap-3">
            <button
              onClick={handleAdd}
              disabled={adding}
              className="bg-cinnabar text-white text-[9px] tracking-[0.3em] uppercase px-6 py-2 hover:bg-cinnabar-dark transition-colors disabled:opacity-40"
            >
              {adding ? "Adding..." : "Add Agent"}
            </button>
            <button
              onClick={() => {
                setShowAdd(false);
                setError(null);
              }}
              className="text-gunmetal text-[9px] tracking-[0.3em] uppercase hover:text-white transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Agent list */}
      <div className="flex flex-col">
        {agents.map((agent) => (
          <div
            key={agent._id}
            className="flex items-center justify-between px-4 md:px-6 py-4 border-b border-surface-border/60 hover:bg-surface/30 transition-colors"
          >
            <div className="flex items-center gap-4 min-w-0">
              <div className="w-8 h-8 border border-surface-border flex items-center justify-center flex-shrink-0">
                <span className="text-sulfur text-[10px] font-mono">
                  {(agent.agentId ?? "?").slice(0, 2).toUpperCase()}
                </span>
              </div>
              <div className="flex flex-col gap-0.5 min-w-0">
                <p className="text-white text-sm truncate">
                  {agent.email ?? "—"}
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-sulfur text-[10px] font-mono">
                    {agent.agentId ?? "—"}
                  </span>
                  {agent.mlsName && (
                    <>
                      <span className="text-gunmetal text-[10px]">·</span>
                      <span className="text-gunmetal text-[10px]">
                        {agent.mlsName}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              {agent.clerkId.startsWith("pending-") ? (
                <span className="text-gunmetal text-[8px] tracking-[0.3em] uppercase border border-surface-border px-2 py-0.5">
                  Pending
                </span>
              ) : agent.onboardingComplete ? (
                <span className="text-[8px] tracking-[0.3em] uppercase bg-sulfur/10 text-sulfur px-2 py-0.5">
                  Active
                </span>
              ) : (
                <span className="text-[8px] tracking-[0.3em] uppercase border border-surface-border text-gunmetal px-2 py-0.5">
                  Setup
                </span>
              )}
              {confirmRemove === agent._id ? (
                <div className="flex items-center gap-2">
                  <button
                    onClick={async () => {
                      await removeAgent({ userId: agent._id });
                      setConfirmRemove(null);
                    }}
                    className="text-cinnabar text-[9px] tracking-[0.2em] uppercase"
                  >
                    Confirm
                  </button>
                  <button
                    onClick={() => setConfirmRemove(null)}
                    className="text-gunmetal text-[9px] tracking-[0.2em] uppercase"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmRemove(agent._id)}
                  className="text-gunmetal text-[9px] tracking-[0.2em] uppercase hover:text-cinnabar transition-colors"
                >
                  Remove
                </button>
              )}
            </div>
          </div>
        ))}
        {agents.length === 0 && (
          <p className="text-gunmetal text-sm py-8 text-center">
            No agents yet. Click &quot;+ Add Agent&quot; to get started.
          </p>
        )}
      </div>
    </div>
  );
}

/* ── Listings Tab ──────────────────────────────────────────── */

type BrokerageListing = {
  _id: Id<"listings">;
  address: string;
  city: string;
  state: string;
  price: number;
  siteStatus: string;
  agentEmail?: string;
  agentName?: string;
  images: string[];
};

function ListingsTab({ listings }: { listings: BrokerageListing[] }) {
  const fmt = (n: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(n);

  return (
    <div className="flex flex-col gap-4">
      <p className="text-gunmetal text-xs">
        {listings.length} listing{listings.length !== 1 ? "s" : ""} across all
        agents
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {listings.map((listing) => (
          <div
            key={listing._id}
            className="border border-surface-border bg-surface overflow-hidden flex flex-col"
          >
            <div className="h-32 bg-obsidian-deep relative overflow-hidden">
              {listing.images[0] ? (
                <img
                  src={listing.images[0]}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-gunmetal text-[9px] tracking-widest uppercase">
                    No Image
                  </span>
                </div>
              )}
              <span
                className={`absolute top-2 right-2 text-[7px] tracking-[0.3em] uppercase px-2 py-0.5 font-semibold ${
                  listing.siteStatus === "published"
                    ? "bg-sulfur text-obsidian"
                    : "bg-surface-border text-gunmetal"
                }`}
              >
                {listing.siteStatus === "published" ? "Live" : "Draft"}
              </span>
            </div>
            <div className="p-4 flex flex-col gap-1.5">
              <p className="text-white text-sm font-medium truncate">
                {listing.address}
              </p>
              <p className="text-gunmetal text-[10px]">
                {listing.city}, {listing.state}
              </p>
              <div className="flex items-center justify-between pt-1">
                <p className="text-sulfur text-sm font-mono">
                  {fmt(listing.price)}
                </p>
                <p className="text-gunmetal text-[9px] truncate ml-2">
                  {listing.agentName ?? listing.agentEmail ?? "—"}
                </p>
              </div>
            </div>
          </div>
        ))}
        {listings.length === 0 && (
          <p className="text-gunmetal text-sm py-8 col-span-full text-center">
            No listings yet. Add agents and sync their listings.
          </p>
        )}
      </div>
    </div>
  );
}

/* ── Leads Tab ─────────────────────────────────────────────── */

type BrokerageLead = {
  _id: Id<"leads">;
  name: string;
  email: string;
  phone?: string;
  address: string;
  message?: string;
  submittedAt: number;
  status?: string;
  agentEmail?: string;
  agentId?: string;
};

function LeadsTab({ leads }: { leads: BrokerageLead[] }) {
  return (
    <div className="flex flex-col gap-4">
      <p className="text-gunmetal text-xs">
        {leads.length} lead{leads.length !== 1 ? "s" : ""} across all agents
      </p>
      <div className="flex flex-col">
        {leads.map((lead) => (
          <div
            key={lead._id}
            className="flex flex-col sm:flex-row sm:items-center justify-between px-4 md:px-6 py-4 border-b border-surface-border/60 gap-2"
          >
            <div className="flex flex-col gap-0.5 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-white text-sm font-medium">{lead.name}</p>
                <span
                  className={`text-[7px] tracking-[0.3em] uppercase px-1.5 py-0.5 ${
                    lead.status === "contacted"
                      ? "bg-sulfur/10 text-sulfur"
                      : lead.status === "archived"
                        ? "bg-surface-border text-gunmetal"
                        : "bg-cinnabar/10 text-cinnabar"
                  }`}
                >
                  {lead.status ?? "new"}
                </span>
              </div>
              <p className="text-gunmetal text-[10px] truncate">
                {lead.address}
              </p>
            </div>
            <div className="flex items-center gap-4 flex-shrink-0">
              <div className="flex flex-col items-end gap-0.5">
                <a
                  href={`mailto:${lead.email}`}
                  className="text-sulfur text-[10px] hover:underline"
                >
                  {lead.email}
                </a>
                {lead.agentId && (
                  <p className="text-gunmetal text-[9px]">
                    Agent: {lead.agentId}
                  </p>
                )}
              </div>
              <p className="text-gunmetal text-[9px] tabular-nums">
                {new Date(lead.submittedAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        ))}
        {leads.length === 0 && (
          <p className="text-gunmetal text-sm py-8 text-center">
            No leads yet.
          </p>
        )}
      </div>
    </div>
  );
}

/* ── Branding Tab ──────────────────────────────────────────── */

type Brokerage = {
  _id: Id<"brokerages">;
  name: string;
  logoUrl?: string;
  primaryColor?: string;
  accentColor?: string;
  domain?: string;
  hasCustomApiKey?: boolean;
};

function BrandingTab({ brokerage }: { brokerage: Brokerage }) {
  const updateBrokerage = useMutation(api.brokerages.updateBrokerage);
  const [name, setName] = useState(brokerage.name);
  const [logoUrl, setLogoUrl] = useState(brokerage.logoUrl ?? "");
  const [primaryColor, setPrimaryColor] = useState(
    brokerage.primaryColor ?? "#F2FF00",
  );
  const [accentColor, setAccentColor] = useState(
    brokerage.accentColor ?? "#E96812",
  );
  const [domain, setDomain] = useState(brokerage.domain ?? "");
  const [apiKey, setApiKey] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      await updateBrokerage({
        name,
        logoUrl: logoUrl || undefined,
        primaryColor,
        accentColor,
        domain: domain || undefined,
        customApiKey: apiKey || undefined,
      });
      setApiKey("");
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-8 max-w-lg">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="branding-name"
            className="text-[9px] tracking-[0.3em] uppercase text-gunmetal"
          >
            Brokerage Name
          </label>
          <input
            id="branding-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-obsidian-deep border border-surface-border text-white text-sm px-4 py-2.5 focus:outline-none focus:border-gunmetal"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="branding-logo-url"
            className="text-[9px] tracking-[0.3em] uppercase text-gunmetal"
          >
            Logo URL
          </label>
          <input
            id="branding-logo-url"
            type="url"
            value={logoUrl}
            onChange={(e) => setLogoUrl(e.target.value)}
            placeholder="https://yourbrokerage.com/logo.png"
            className="w-full bg-obsidian-deep border border-surface-border text-white text-sm px-4 py-2.5 focus:outline-none focus:border-gunmetal placeholder:text-gunmetal"
          />
          {logoUrl && (
            <div className="border border-surface-border p-4 bg-surface flex items-center justify-center">
              <img
                src={logoUrl}
                alt="Preview"
                className="h-10 object-contain"
                onError={(e) => (e.currentTarget.style.display = "none")}
              />
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <p className="text-[9px] tracking-[0.3em] uppercase text-gunmetal">
              Primary Color
            </p>
            <div className="flex items-center gap-3">
              <input
                type="color"
                aria-label="Primary color picker"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="w-8 h-8 border border-surface-border bg-transparent cursor-pointer"
              />
              <input
                type="text"
                aria-label="Primary color hex value"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="flex-1 bg-obsidian-deep border border-surface-border text-white text-sm px-3 py-1.5 focus:outline-none focus:border-gunmetal font-mono"
              />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <p className="text-[9px] tracking-[0.3em] uppercase text-gunmetal">
              Accent Color
            </p>
            <div className="flex items-center gap-3">
              <input
                type="color"
                aria-label="Accent color picker"
                value={accentColor}
                onChange={(e) => setAccentColor(e.target.value)}
                className="w-8 h-8 border border-surface-border bg-transparent cursor-pointer"
              />
              <input
                type="text"
                aria-label="Accent color hex value"
                value={accentColor}
                onChange={(e) => setAccentColor(e.target.value)}
                className="flex-1 bg-obsidian-deep border border-surface-border text-white text-sm px-3 py-1.5 focus:outline-none focus:border-gunmetal font-mono"
              />
            </div>
          </div>
        </div>

        {/* Preview swatch */}
        <div className="border border-surface-border p-4 flex items-center gap-4">
          <div
            className="w-10 h-10 border border-surface-border"
            style={{ backgroundColor: primaryColor }}
          />
          <div
            className="w-10 h-10 border border-surface-border"
            style={{ backgroundColor: accentColor }}
          />
          <div className="flex flex-col gap-0.5">
            <p className="text-white text-sm">{name}</p>
            <p className="text-gunmetal text-[10px]">Brand preview</p>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="whitelabel-domain"
            className="text-[9px] tracking-[0.3em] uppercase text-gunmetal"
          >
            Whitelabel Domain
          </label>
          <input
            id="whitelabel-domain"
            type="text"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            placeholder="listings.yourbrokerage.com"
            className="w-full bg-obsidian-deep border border-surface-border text-white text-sm px-4 py-2.5 focus:outline-none focus:border-gunmetal placeholder:text-gunmetal"
          />
          <p className="text-gunmetal text-[10px]">
            Point a CNAME to luxengine.io to use your own domain.
          </p>
        </div>

        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="brokerage-idx-key"
            className="text-[9px] tracking-[0.3em] uppercase text-gunmetal"
          >
            Brokerage IDX API Key
          </label>
          <input
            id="brokerage-idx-key"
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder={
              brokerage.hasCustomApiKey
                ? "••••••••••••"
                : "Optional — overrides master key for all agents"
            }
            className="w-full bg-obsidian-deep border border-surface-border text-white text-sm px-4 py-2.5 focus:outline-none focus:border-gunmetal placeholder:text-gunmetal"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-cinnabar text-white px-8 py-3 text-[9px] tracking-[0.35em] uppercase font-medium hover:bg-cinnabar-dark transition-colors disabled:opacity-40"
        >
          {saving ? "Saving..." : "Save Branding"}
        </button>
        {saved && (
          <span
            role="status"
            className="text-sulfur text-[9px] tracking-[0.3em] uppercase"
          >
            Saved ✓
          </span>
        )}
      </div>
    </div>
  );
}
