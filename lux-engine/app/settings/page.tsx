"use client";

import { useState } from "react";
import { useAction, useMutation, useQuery } from "convex/react";
import { Authenticated, Unauthenticated } from "convex/react";
import { SignInButton, UserButton } from "@clerk/nextjs";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import Link from "next/link";

export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-obsidian-deep">
      <SettingsHeader />
      <main>
        <Authenticated>
          <SettingsContent />
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

function SettingsHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-surface-border bg-obsidian-deep/95 backdrop-blur">
      <div className="max-w-4xl mx-auto px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-5">
          <Link
            href="/"
            className="text-gunmetal hover:text-white transition-colors duration-200"
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
            Settings
          </span>
        </div>
        <Authenticated>
          <UserButton />
        </Authenticated>
      </div>
    </header>
  );
}

function SettingsContent() {
  const profile = useQuery(api.users.getMyProfile);

  if (profile === undefined) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border border-surface-border border-t-sulfur/60 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-8 py-16 flex flex-col gap-16">
      {/* Page heading */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-4">
          <div className="w-6 h-px bg-sulfur" />
          <p className="text-[9px] tracking-[0.5em] uppercase text-gunmetal">
            Account
          </p>
        </div>
        <h1
          style={{ fontFamily: "var(--font-playfair)" }}
          className="text-white text-4xl font-normal"
        >
          Settings
        </h1>
      </div>

      {/* MLS Connection */}
      <SettingsSection
        label="MLS Connection"
        description="Your IDX Broker Agent ID links Lux Engine to your MLS listings."
      >
        <MLSConnectionForm profile={profile} />
      </SettingsSection>

      {/* Custom API Key */}
      <SettingsSection
        label="Custom IDX API Key"
        description="Bring your own IDX Broker API key for direct access. Leave blank to use the platform key."
      >
        <ApiKeyForm profile={profile} />
      </SettingsSection>

      {/* Custom Domains */}
      <SettingsSection
        label="Custom Domains"
        description="Connect your own domain to any live property site. Point your domain's DNS (CNAME) to luxengine.io, then add it here."
      >
        <CustomDomainsForm />
      </SettingsSection>

      {/* Notification Settings */}
      <SettingsSection
        label="Lead Notifications"
        description="Choose how you want to be notified when a lead submits a tour request."
      >
        <NotificationSettingsForm profile={profile} />
      </SettingsSection>

      {/* Danger Zone */}
      <SettingsSection
        label="Danger Zone"
        description="Irreversible actions — proceed with care."
        danger
      >
        <DangerZone />
      </SettingsSection>
    </div>
  );
}

/* ── Section wrapper ────────────────────────────────────────── */

function SettingsSection({
  label,
  description,
  danger = false,
  children,
}: {
  label: string;
  description: string;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section
      className={`border ${danger ? "border-cinnabar/20" : "border-surface-border"} flex flex-col`}
    >
      {/* Section header */}
      <div
        className={`px-8 py-5 border-b ${danger ? "border-cinnabar/20" : "border-surface-border"} flex flex-col gap-1`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`w-3 h-px ${danger ? "bg-cinnabar/50" : "bg-sulfur/60"}`}
          />
          <p
            className={`text-[9px] tracking-[0.4em] uppercase ${danger ? "text-cinnabar" : "text-gunmetal"}`}
          >
            {label}
          </p>
        </div>
        <p className="text-gunmetal text-xs pl-6">{description}</p>
      </div>

      {/* Section body */}
      <div className="px-8 py-8">{children}</div>
    </section>
  );
}

/* ── MLS Connection form ────────────────────────────────────── */

function MLSConnectionForm({
  profile,
}: {
  profile: { agentId?: string; mlsName?: string } | null;
}) {
  const updateAgentId = useMutation(api.users.updateAgentId);
  const [agentId, setAgentId] = useState(profile?.agentId ?? "");
  const [mlsName, setMlsName] = useState(profile?.mlsName ?? "ARMLS");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const MLS_OPTIONS = ["ARMLS", "CRMLS", "NTREIS", "FMLS", "MRED", "Other"];

  async function handleSave() {
    if (!agentId.trim()) {
      setError("Agent ID is required.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await updateAgentId({ agentId: agentId.trim(), mlsName });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-6 max-w-lg">
      <div className="flex flex-col gap-5">
        <Field label="IDX Broker Agent ID">
          <input
            type="text"
            value={agentId}
            onChange={(e) => setAgentId(e.target.value)}
            placeholder="e.g. a001"
            className={inputCls}
          />
        </Field>
        <Field label="MLS Board">
          <select
            value={mlsName}
            onChange={(e) => setMlsName(e.target.value)}
            className={selectCls}
          >
            {MLS_OPTIONS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </Field>
      </div>

      {error && (
        <p
          role="alert"
          className="text-cinnabar text-xs border border-cinnabar/30 bg-cinnabar/5 px-3 py-2"
        >
          {error}
        </p>
      )}

      <div className="flex items-center gap-4">
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-cinnabar text-white px-8 py-3 text-[9px] tracking-[0.35em] uppercase font-medium hover:bg-cinnabar-dark transition-colors duration-300 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {saving ? "Saving..." : "Save Changes"}
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

/* ── Custom API key form ────────────────────────────────────── */

function ApiKeyForm({
  profile,
}: {
  profile: { hasCustomApiKey?: boolean } | null;
}) {
  const updateKey = useMutation(api.users.updateCustomApiKey);
  const removeKey = useMutation(api.users.removeCustomApiKey);
  const hasKey = profile?.hasCustomApiKey === true;

  const [key, setKey] = useState("");
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    if (!key.trim()) {
      setError("API key cannot be empty.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await updateKey({ customApiKey: key.trim() });
      setKey("");
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function handleRemove() {
    setRemoving(true);
    try {
      await removeKey();
    } finally {
      setRemoving(false);
    }
  }

  return (
    <div className="flex flex-col gap-6 max-w-lg">
      {hasKey && (
        <div className="flex items-center justify-between border border-surface-border px-4 py-3 bg-obsidian-deep">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-sulfur rounded-full" />
            <span className="text-white text-sm font-mono">
              ••••••••••••••••
            </span>
            <span className="text-gunmetal text-[10px] tracking-widest">
              Custom key active
            </span>
          </div>
          <button
            onClick={handleRemove}
            disabled={removing}
            className="text-cinnabar text-[9px] tracking-[0.3em] uppercase hover:text-cinnabar-dark transition-colors duration-200 disabled:opacity-40"
          >
            {removing ? "Removing..." : "Remove"}
          </button>
        </div>
      )}

      <Field label={hasKey ? "Replace Key" : "IDX Broker API Key"}>
        <input
          type="password"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          placeholder="Paste your IDX Broker API key"
          className={inputCls}
        />
      </Field>

      {error && (
        <p
          role="alert"
          className="text-cinnabar text-xs border border-cinnabar/30 bg-cinnabar/5 px-3 py-2"
        >
          {error}
        </p>
      )}

      <div className="flex items-center gap-4">
        <button
          onClick={handleSave}
          disabled={saving || !key.trim()}
          className="bg-cinnabar text-white px-8 py-3 text-[9px] tracking-[0.35em] uppercase font-medium hover:bg-cinnabar-dark transition-colors duration-300 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {saving ? "Saving..." : hasKey ? "Replace Key" : "Save Key"}
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

/* ── Custom Domains form ───────────────────────────────────── */

function CustomDomainsForm() {
  const sites = useQuery(api.sites.getMySites);
  const setDomain = useMutation(api.sites.setCustomDomain);
  const removeDomain = useMutation(api.sites.removeCustomDomain);
  const verifyDns = useAction(api.sites.verifyDns);

  const [editingSiteId, setEditingSiteId] = useState<string | null>(null);
  const [domainInput, setDomainInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [verifying, setVerifying] = useState<string | null>(null);
  const [dnsResult, setDnsResult] = useState<
    Record<
      string,
      { verified: boolean; error?: string | null; records?: string[] }
    >
  >({});

  if (sites === undefined) {
    return (
      <div className="w-6 h-6 border border-surface-border border-t-sulfur/60 rounded-full animate-spin" />
    );
  }

  const liveSites = sites.filter((s) => s.status === "live");

  if (liveSites.length === 0) {
    return (
      <p className="text-gunmetal text-sm">
        No live sites yet. Launch a property site first, then connect a custom
        domain here.
      </p>
    );
  }

  async function handleSave(siteId: string) {
    if (!domainInput.trim()) {
      setError("Domain cannot be empty.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await setDomain({
        siteId: siteId as Id<"sites">,
        customDomain: domainInput.trim(),
      });
      setEditingSiteId(null);
      setDomainInput("");
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save domain");
    } finally {
      setSaving(false);
    }
  }

  async function handleRemove(siteId: string) {
    try {
      await removeDomain({ siteId: siteId as Id<"sites"> });
    } catch {
      // silent
    }
  }

  return (
    <div className="flex flex-col gap-5">
      {saved && (
        <p
          role="status"
          className="text-sulfur text-[9px] tracking-[0.3em] uppercase"
        >
          Domain saved ✓
        </p>
      )}

      {liveSites.map((site) => (
        <div
          key={site._id}
          className="border border-surface-border bg-obsidian-deep px-6 py-4 flex flex-col gap-3"
        >
          {/* Site info */}
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-0.5">
              <p className="text-white text-sm font-mono">/{site.subdomain}</p>
              <p className="text-gunmetal text-[10px]">
                Listing: {site.listingId}
              </p>
            </div>
            <span className="text-[8px] tracking-[0.3em] uppercase bg-sulfur text-obsidian px-2 py-0.5 font-semibold">
              Live
            </span>
          </div>

          {/* Current custom domain or edit form */}
          {site.customDomain && editingSiteId !== site._id ? (
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between border border-sulfur/20 px-4 py-2.5 bg-surface">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-2 h-2 rounded-full ${dnsResult[site._id]?.verified ? "bg-sulfur" : "bg-sulfur"}`}
                  />
                  <span className="text-white text-sm font-mono">
                    {site.customDomain}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={async () => {
                      setVerifying(site._id);
                      try {
                        const result = await verifyDns({
                          siteId: site._id as Id<"sites">,
                        });
                        setDnsResult((prev) => ({
                          ...prev,
                          [site._id]: result,
                        }));
                      } finally {
                        setVerifying(null);
                      }
                    }}
                    disabled={verifying === site._id}
                    className="text-sulfur text-[9px] tracking-[0.25em] uppercase hover:text-sulfur/80 transition-colors disabled:opacity-50"
                  >
                    {verifying === site._id ? "Checking..." : "Verify DNS"}
                  </button>
                  <button
                    onClick={() => {
                      setEditingSiteId(site._id);
                      setDomainInput(site.customDomain ?? "");
                      setError(null);
                    }}
                    className="text-gunmetal text-[9px] tracking-[0.25em] uppercase hover:text-white transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleRemove(site._id)}
                    className="text-cinnabar text-[9px] tracking-[0.25em] uppercase hover:text-cinnabar transition-colors"
                  >
                    Remove
                  </button>
                </div>
              </div>
              {dnsResult[site._id] && (
                <div
                  role="status"
                  className={`px-4 py-2 text-[10px] tracking-widest border ${dnsResult[site._id].verified ? "border-sulfur/30 text-sulfur bg-sulfur/5" : "border-cinnabar/30 text-cinnabar bg-cinnabar/5"}`}
                >
                  {dnsResult[site._id].verified
                    ? "✓ DNS verified — CNAME correctly pointing to luxengine.io"
                    : `✗ ${dnsResult[site._id].error}${dnsResult[site._id].records?.length ? ` (found: ${dnsResult[site._id].records!.join(", ")})` : ""}`}
                </div>
              )}
            </div>
          ) : editingSiteId === site._id ? (
            <div className="flex flex-col gap-3">
              <Field label="Custom Domain">
                <input
                  type="text"
                  value={domainInput}
                  onChange={(e) => setDomainInput(e.target.value)}
                  placeholder="e.g. 123camelback.com"
                  className={inputCls}
                />
              </Field>
              {error && (
                <p role="alert" className="text-cinnabar text-xs">
                  {error}
                </p>
              )}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleSave(site._id)}
                  disabled={saving}
                  className="bg-cinnabar text-white px-6 py-2 text-[9px] tracking-[0.3em] uppercase hover:bg-cinnabar-dark transition-colors disabled:opacity-40"
                >
                  {saving ? "Saving..." : "Save"}
                </button>
                <button
                  onClick={() => {
                    setEditingSiteId(null);
                    setError(null);
                  }}
                  className="text-gunmetal text-[9px] tracking-[0.25em] uppercase hover:text-white transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => {
                setEditingSiteId(site._id);
                setDomainInput("");
                setError(null);
              }}
              className="border border-dashed border-surface-border text-gunmetal text-[9px] tracking-[0.3em] uppercase py-2.5 hover:border-gunmetal hover:text-white transition-colors"
            >
              + Connect Domain
            </button>
          )}
        </div>
      ))}

      {/* DNS instructions */}
      <div className="border-t border-surface-border pt-5 flex flex-col gap-2">
        <p className="text-[9px] tracking-[0.3em] uppercase text-gunmetal">
          DNS Setup
        </p>
        <div className="text-gunmetal text-xs leading-relaxed">
          <p>
            1. Go to your domain registrar (GoDaddy, Namecheap, Cloudflare,
            etc.)
          </p>
          <p>
            2. Add a <span className="text-white font-mono">CNAME</span> record
            pointing to{" "}
            <span className="text-sulfur font-mono">luxengine.io</span>
          </p>
          <p>3. Wait for DNS to propagate (usually 5-30 minutes)</p>
          <p>4. Enter your domain above and save</p>
        </div>
      </div>
    </div>
  );
}

/* ── Notification Settings form ─────────────────────────────── */

function NotificationSettingsForm({
  profile,
}: {
  profile: {
    phone?: string;
    notifyEmail?: boolean;
    notifySms?: boolean;
  } | null;
}) {
  const updateSettings = useMutation(api.users.updateNotificationSettings);
  const [phone, setPhone] = useState(profile?.phone ?? "");
  const [notifyEmail, setNotifyEmail] = useState(
    profile?.notifyEmail !== false,
  );
  const [notifySms, setNotifySms] = useState(profile?.notifySms === true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    if (notifySms && !phone.trim()) {
      setError("Phone number is required for SMS notifications.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await updateSettings({
        phone: phone.trim() || undefined,
        notifyEmail,
        notifySms,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-6 max-w-lg">
      {/* Email toggle */}
      <div className="flex items-center justify-between border border-surface-border px-4 py-3 bg-obsidian-deep">
        <div className="flex flex-col gap-0.5">
          <span className="text-white text-sm">Email Notifications</span>
          <span className="text-gunmetal text-[10px]">
            Receive an email when a lead requests a tour
          </span>
        </div>
        <button
          onClick={() => setNotifyEmail(!notifyEmail)}
          role="switch"
          aria-checked={notifyEmail}
          aria-label="Email notifications"
          className={`w-10 h-6 rounded-full transition-colors duration-200 relative ${notifyEmail ? "bg-sulfur" : "bg-surface-border"}`}
        >
          <span
            className={`absolute top-1 w-4 h-4 rounded-full transition-transform duration-200 ${notifyEmail ? "translate-x-5 bg-obsidian" : "translate-x-0.5 bg-gunmetal"}`}
          />
        </button>
      </div>

      {/* SMS toggle */}
      <div className="flex items-center justify-between border border-surface-border px-4 py-3 bg-obsidian-deep">
        <div className="flex flex-col gap-0.5">
          <span className="text-white text-sm">SMS Notifications</span>
          <span className="text-gunmetal text-[10px]">
            Receive a text message for new leads
          </span>
        </div>
        <button
          onClick={() => setNotifySms(!notifySms)}
          role="switch"
          aria-checked={notifySms}
          aria-label="SMS notifications"
          className={`w-10 h-6 rounded-full transition-colors duration-200 relative ${notifySms ? "bg-sulfur" : "bg-surface-border"}`}
        >
          <span
            className={`absolute top-1 w-4 h-4 rounded-full transition-transform duration-200 ${notifySms ? "translate-x-5 bg-obsidian" : "translate-x-0.5 bg-gunmetal"}`}
          />
        </button>
      </div>

      {/* Phone number (shown when SMS enabled) */}
      {notifySms && (
        <Field label="Mobile Phone Number">
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+1 (602) 555-0100"
            className={inputCls}
          />
        </Field>
      )}

      {!process.env.NEXT_PUBLIC_TWILIO_ENABLED && notifySms && (
        <p className="text-gunmetal text-[10px] border border-surface-border px-3 py-2 bg-surface">
          SMS requires Twilio configuration. Contact support to enable SMS
          notifications.
        </p>
      )}

      {error && (
        <p
          role="alert"
          className="text-cinnabar text-xs border border-cinnabar/30 bg-cinnabar/5 px-3 py-2"
        >
          {error}
        </p>
      )}

      <div className="flex items-center gap-4">
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-cinnabar text-white px-8 py-3 text-[9px] tracking-[0.35em] uppercase font-medium hover:bg-cinnabar-dark transition-colors duration-300 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {saving ? "Saving..." : "Save Preferences"}
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

/* ── Danger zone ────────────────────────────────────────────── */

function DangerZone() {
  const resetListings = useMutation(api.listings.resetMyListings);
  const resetOnboarding = useMutation(api.users.resetOnboarding);
  const [resetListLoading, setResetListLoading] = useState(false);
  const [resetOnboardLoading, setResetOnboardLoading] = useState(false);
  const [confirmReset, setConfirmReset] = useState<
    "listings" | "onboarding" | null
  >(null);

  async function handleResetListings() {
    setResetListLoading(true);
    try {
      await resetListings();
      setConfirmReset(null);
    } finally {
      setResetListLoading(false);
    }
  }

  async function handleResetOnboarding() {
    setResetOnboardLoading(true);
    try {
      await resetOnboarding();
      window.location.href = "/";
    } finally {
      setResetOnboardLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Reset Listings */}
      <DangerRow
        label="Reset All Listings"
        description="Permanently deletes all your listings and site records. Cannot be undone."
        buttonLabel="Reset Listings"
        loading={resetListLoading}
        confirming={confirmReset === "listings"}
        onRequest={() => setConfirmReset("listings")}
        onCancel={() => setConfirmReset(null)}
        onConfirm={handleResetListings}
      />

      <div className="h-px bg-surface-border" />

      {/* Reset Onboarding */}
      <DangerRow
        label="Reset Onboarding"
        description="Clears your Agent ID and MLS connection. You'll be walked through setup again."
        buttonLabel="Reset Account"
        loading={resetOnboardLoading}
        confirming={confirmReset === "onboarding"}
        onRequest={() => setConfirmReset("onboarding")}
        onCancel={() => setConfirmReset(null)}
        onConfirm={handleResetOnboarding}
      />
    </div>
  );
}

function DangerRow({
  label,
  description,
  buttonLabel,
  loading,
  confirming,
  onRequest,
  onCancel,
  onConfirm,
}: {
  label: string;
  description: string;
  buttonLabel: string;
  loading: boolean;
  confirming: boolean;
  onRequest: () => void;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="flex flex-col gap-1">
        <p className="text-white text-sm">{label}</p>
        <p className="text-gunmetal text-xs">{description}</p>
      </div>

      {confirming ? (
        <div className="flex items-center gap-3 flex-shrink-0">
          <span className="text-cinnabar text-[9px] tracking-[0.25em] uppercase">
            Are you sure?
          </span>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="border border-cinnabar text-cinnabar px-4 py-2 text-[9px] tracking-[0.25em] uppercase hover:bg-cinnabar hover:text-white transition-colors duration-200 disabled:opacity-40"
          >
            {loading ? "..." : "Yes, Delete"}
          </button>
          <button
            onClick={onCancel}
            className="text-gunmetal text-[9px] tracking-[0.25em] uppercase hover:text-white transition-colors duration-200"
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          onClick={onRequest}
          className="flex-shrink-0 border border-cinnabar text-cinnabar px-5 py-2 text-[9px] tracking-[0.3em] uppercase hover:border-cinnabar hover:text-cinnabar transition-colors duration-200"
        >
          {buttonLabel}
        </button>
      )}
    </div>
  );
}

/* ── Shared style utils ─────────────────────────────────────── */

const inputCls =
  "w-full bg-obsidian-deep border border-surface-border text-white text-sm px-4 py-2.5 focus:outline-none focus:border-gunmetal placeholder:text-gunmetal transition-colors duration-200";

const selectCls =
  "w-full bg-obsidian-deep border border-surface-border text-white text-sm px-4 py-2.5 focus:outline-none focus:border-gunmetal transition-colors duration-200 cursor-pointer appearance-none";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[9px] tracking-[0.3em] uppercase text-gunmetal">
        {label}
      </span>
      {children}
    </label>
  );
}
