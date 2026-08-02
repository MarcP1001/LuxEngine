"use client";

import { Authenticated, Unauthenticated, useQuery } from "convex/react";
import { SignInButton, UserButton } from "@clerk/nextjs";
import { useState } from "react";
import Link from "next/link";
import { api } from "../../convex/_generated/api";

export default function AdminPage() {
  return (
    <div className="min-h-screen bg-obsidian-deep">
      <AdminHeader />
      <main>
        <Authenticated>
          <AdminGate />
        </Authenticated>
        <Unauthenticated>
          <div className="max-w-md mx-auto mt-32 text-center">
            <p className="text-gunmetal text-sm mb-6">
              Authentication required to access admin dashboard.
            </p>
            <SignInButton mode="modal">
              <button className="border border-sulfur/40 text-sulfur text-[9px] tracking-[0.35em] uppercase px-5 py-2 hover:bg-sulfur hover:text-obsidian transition-all duration-300">
                Sign In
              </button>
            </SignInButton>
          </div>
        </Unauthenticated>
      </main>
    </div>
  );
}

function AdminHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-surface-border bg-obsidian-deep/95 backdrop-blur">
      <div className="max-w-[1400px] mx-auto px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-5">
          <Link href="/" className="flex items-center gap-5">
            <span
              style={{
                fontFamily: "var(--font-playfair)",
                letterSpacing: "0.25em",
              }}
              className="text-sulfur text-lg font-medium uppercase"
            >
              Lux Engine
            </span>
            <span className="w-px h-4 bg-surface-border" />
            <span className="text-cinnabar text-[10px] tracking-[0.35em] uppercase font-medium">
              Superadmin
            </span>
          </Link>
        </div>
        <div className="flex items-center gap-4">
          <Authenticated>
            <Link
              href="/"
              className="text-gunmetal text-[9px] tracking-[0.3em] uppercase hover:text-white transition-colors"
            >
              Dashboard
            </Link>
            <UserButton />
          </Authenticated>
        </div>
      </div>
    </header>
  );
}

function AdminGate() {
  const isSuperadmin = useQuery(api.admin.isSuperadmin);

  if (isSuperadmin === undefined) return <LoadingState />;
  if (!isSuperadmin) {
    return (
      <div className="max-w-md mx-auto mt-32 text-center">
        <div className="w-16 h-16 mx-auto mb-6 border border-cinnabar/30 flex items-center justify-center">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 15v2M8 9V7a4 4 0 1 1 8 0v2M5 9h14a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-9a2 2 0 0 1 2-2z"
              stroke="#D35400"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <p
          className="text-white text-lg mb-2"
          style={{ fontFamily: "var(--font-playfair)" }}
        >
          Access Denied
        </p>
        <p className="text-gunmetal text-sm">
          This dashboard is restricted to superadmins.
        </p>
        <Link
          href="/"
          className="inline-block mt-6 text-sulfur text-[9px] tracking-[0.35em] uppercase border border-sulfur/30 px-5 py-2 hover:bg-sulfur hover:text-obsidian transition-all"
        >
          Back to Dashboard
        </Link>
      </div>
    );
  }

  return <AdminDashboard />;
}

type Tab = "overview" | "users" | "brokerages" | "activity";

function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  const tabs: { id: Tab; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "users", label: "Users" },
    { id: "brokerages", label: "Brokerages" },
    { id: "activity", label: "Activity" },
  ];

  return (
    <div className="max-w-[1400px] mx-auto px-8 py-10">
      <div className="flex items-center gap-1 border-b border-surface-border mb-10">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-5 py-3 text-[9px] tracking-[0.35em] uppercase transition-colors ${
              activeTab === tab.id
                ? "text-sulfur border-b-2 border-sulfur"
                : "text-gunmetal hover:text-white"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "overview" && <OverviewTab />}
      {activeTab === "users" && <UsersTab />}
      {activeTab === "brokerages" && <BrokeragesTab />}
      {activeTab === "activity" && <ActivityTab />}
    </div>
  );
}

function OverviewTab() {
  const stats = useQuery(api.admin.getPlatformStats);
  const userGrowth = useQuery(api.admin.getUserGrowth);
  const leadsByDay = useQuery(api.admin.getLeadsByDay);

  if (!stats) return <LoadingState />;

  const statCards = [
    {
      label: "Total Users",
      value: stats.totalUsers,
      sub: `${stats.usersToday} today`,
    },
    {
      label: "Onboarded",
      value: stats.onboardedUsers,
      sub: `${Math.round((stats.onboardedUsers / Math.max(stats.totalUsers, 1)) * 100)}% conversion`,
    },
    {
      label: "Active Subscribers",
      value: stats.activeSubscribers,
      accent: true,
    },
    {
      label: "MRR",
      value: `$${stats.mrr.toLocaleString()}`,
      accent: true,
      sub: `$${stats.arr.toLocaleString()} ARR`,
    },
    {
      label: "Total Listings",
      value: stats.totalListings,
      sub: `${stats.activeListings} active`,
    },
    {
      label: "Published Sites",
      value: stats.publishedListings,
      sub: `${stats.sitesThisWeek} this week`,
    },
    { label: "Live Sites", value: stats.liveSites },
    {
      label: "Total Leads",
      value: stats.totalLeads,
      sub: `${stats.leadsToday} today`,
    },
    { label: "Brokerages", value: stats.totalBrokerages },
    {
      label: "Portfolio Value",
      value: `$${(stats.portfolioValue / 1_000_000).toFixed(1)}M`,
      accent: true,
    },
  ];

  return (
    <div className="flex flex-col gap-10">
      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="border border-surface-border bg-surface p-5"
          >
            <p className="text-[8px] tracking-[0.4em] uppercase text-gunmetal mb-2">
              {card.label}
            </p>
            <p
              style={{ fontFamily: "var(--font-playfair)" }}
              className={`text-2xl font-light ${card.accent ? "text-sulfur" : "text-white"}`}
            >
              {card.value}
            </p>
            {card.sub && (
              <p className="text-[10px] text-gunmetal mt-1">{card.sub}</p>
            )}
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="border border-surface-border bg-surface p-6">
          <p className="text-[9px] tracking-[0.35em] uppercase text-gunmetal mb-4">
            User Signups — 30 Days
          </p>
          {userGrowth ? (
            <MiniChart data={userGrowth} color="#F2FF00" />
          ) : (
            <ChartSkeleton />
          )}
        </div>
        <div className="border border-surface-border bg-surface p-6">
          <p className="text-[9px] tracking-[0.35em] uppercase text-gunmetal mb-4">
            Leads — 30 Days
          </p>
          {leadsByDay ? (
            <MiniChart data={leadsByDay} color="#D35400" />
          ) : (
            <ChartSkeleton />
          )}
        </div>
      </div>

      {/* Revenue breakdown */}
      <div className="border border-surface-border bg-surface p-6">
        <p className="text-[9px] tracking-[0.35em] uppercase text-gunmetal mb-6">
          Revenue Metrics
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
          <div>
            <p className="text-gunmetal text-[10px] mb-1">Monthly Recurring</p>
            <p
              className="text-sulfur text-xl font-light"
              style={{ fontFamily: "var(--font-playfair)" }}
            >
              ${stats.mrr.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-gunmetal text-[10px] mb-1">Annual Run Rate</p>
            <p
              className="text-sulfur text-xl font-light"
              style={{ fontFamily: "var(--font-playfair)" }}
            >
              ${stats.arr.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-gunmetal text-[10px] mb-1">Avg Revenue / User</p>
            <p
              className="text-white text-xl font-light"
              style={{ fontFamily: "var(--font-playfair)" }}
            >
              $100/mo
            </p>
          </div>
          <div>
            <p className="text-gunmetal text-[10px] mb-1">Churn Rate</p>
            <p
              className="text-white text-xl font-light"
              style={{ fontFamily: "var(--font-playfair)" }}
            >
              —
            </p>
            <p className="text-gunmetal text-[10px] mt-1">
              Available after Stripe
            </p>
          </div>
        </div>
      </div>

      {/* Time-period comparison */}
      <div className="border border-surface-border bg-surface p-6">
        <p className="text-[9px] tracking-[0.35em] uppercase text-gunmetal mb-6">
          Period Comparison
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-border">
                <th className="text-left text-[9px] tracking-[0.3em] uppercase text-gunmetal py-3 pr-4">
                  Metric
                </th>
                <th className="text-right text-[9px] tracking-[0.3em] uppercase text-gunmetal py-3 px-4">
                  Today
                </th>
                <th className="text-right text-[9px] tracking-[0.3em] uppercase text-gunmetal py-3 px-4">
                  This Week
                </th>
                <th className="text-right text-[9px] tracking-[0.3em] uppercase text-gunmetal py-3 px-4">
                  This Month
                </th>
                <th className="text-right text-[9px] tracking-[0.3em] uppercase text-gunmetal py-3 pl-4">
                  All Time
                </th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-surface-border/50">
                <td className="py-3 pr-4 text-white">New Users</td>
                <td className="py-3 px-4 text-right text-sulfur">
                  {stats.usersToday}
                </td>
                <td className="py-3 px-4 text-right text-white">
                  {stats.usersThisWeek}
                </td>
                <td className="py-3 px-4 text-right text-white">
                  {stats.usersThisMonth}
                </td>
                <td className="py-3 pl-4 text-right text-gunmetal">
                  {stats.totalUsers}
                </td>
              </tr>
              <tr className="border-b border-surface-border/50">
                <td className="py-3 pr-4 text-white">Leads</td>
                <td className="py-3 px-4 text-right text-sulfur">
                  {stats.leadsToday}
                </td>
                <td className="py-3 px-4 text-right text-white">
                  {stats.leadsThisWeek}
                </td>
                <td className="py-3 px-4 text-right text-white">
                  {stats.leadsThisMonth}
                </td>
                <td className="py-3 pl-4 text-right text-gunmetal">
                  {stats.totalLeads}
                </td>
              </tr>
              <tr>
                <td className="py-3 pr-4 text-white">Sites Launched</td>
                <td className="py-3 px-4 text-right text-sulfur">—</td>
                <td className="py-3 px-4 text-right text-white">
                  {stats.sitesThisWeek}
                </td>
                <td className="py-3 px-4 text-right text-white">—</td>
                <td className="py-3 pl-4 text-right text-gunmetal">
                  {stats.liveSites}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function UsersTab() {
  const users = useQuery(api.admin.getAllUsers);
  const [search, setSearch] = useState("");

  if (!users) return <LoadingState />;

  const filtered = search
    ? users.filter(
        (u) =>
          u.email?.toLowerCase().includes(search.toLowerCase()) ||
          u.agentId?.toLowerCase().includes(search.toLowerCase()) ||
          u.brokerageName?.toLowerCase().includes(search.toLowerCase()),
      )
    : users;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <p className="text-white text-sm">{users.length} total users</p>
        <input
          type="text"
          placeholder="Search by email, agent ID, or brokerage..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-surface border border-surface-border text-white text-sm px-4 py-2 w-80 focus:border-sulfur/50 outline-none placeholder:text-gunmetal"
        />
      </div>

      <div className="overflow-x-auto border border-surface-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-surface border-b border-surface-border">
              <th className="text-left text-[8px] tracking-[0.3em] uppercase text-gunmetal py-3 px-4">
                Email
              </th>
              <th className="text-left text-[8px] tracking-[0.3em] uppercase text-gunmetal py-3 px-4">
                Agent ID
              </th>
              <th className="text-left text-[8px] tracking-[0.3em] uppercase text-gunmetal py-3 px-4">
                MLS
              </th>
              <th className="text-left text-[8px] tracking-[0.3em] uppercase text-gunmetal py-3 px-4">
                Role
              </th>
              <th className="text-left text-[8px] tracking-[0.3em] uppercase text-gunmetal py-3 px-4">
                Brokerage
              </th>
              <th className="text-right text-[8px] tracking-[0.3em] uppercase text-gunmetal py-3 px-4">
                Listings
              </th>
              <th className="text-right text-[8px] tracking-[0.3em] uppercase text-gunmetal py-3 px-4">
                Live
              </th>
              <th className="text-right text-[8px] tracking-[0.3em] uppercase text-gunmetal py-3 px-4">
                Leads
              </th>
              <th className="text-right text-[8px] tracking-[0.3em] uppercase text-gunmetal py-3 px-4">
                Portfolio
              </th>
              <th className="text-left text-[8px] tracking-[0.3em] uppercase text-gunmetal py-3 px-4">
                Status
              </th>
              <th className="text-left text-[8px] tracking-[0.3em] uppercase text-gunmetal py-3 px-4">
                Joined
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((user) => (
              <tr
                key={user._id}
                className="border-b border-surface-border/50 hover:bg-surface/50"
              >
                <td className="py-3 px-4 text-white text-xs">
                  {user.email ?? "—"}
                </td>
                <td className="py-3 px-4 text-sulfur text-xs font-mono">
                  {user.agentId ?? "—"}
                </td>
                <td className="py-3 px-4 text-gunmetal text-xs">
                  {user.mlsName ?? "—"}
                </td>
                <td className="py-3 px-4">
                  <RoleBadge role={user.role} />
                </td>
                <td className="py-3 px-4 text-gunmetal text-xs">
                  {user.brokerageName ?? "—"}
                </td>
                <td className="py-3 px-4 text-right text-white text-xs">
                  {user.listingCount}
                </td>
                <td className="py-3 px-4 text-right text-sulfur text-xs">
                  {user.liveCount}
                </td>
                <td className="py-3 px-4 text-right text-white text-xs">
                  {user.leadCount}
                </td>
                <td className="py-3 px-4 text-right text-gunmetal text-xs">
                  {user.portfolioValue > 0
                    ? `$${(user.portfolioValue / 1_000_000).toFixed(1)}M`
                    : "—"}
                </td>
                <td className="py-3 px-4">
                  <StatusBadge
                    active={user.onboardingComplete}
                    pending={user.clerkId.startsWith("pending-")}
                  />
                </td>
                <td className="py-3 px-4 text-gunmetal text-xs">
                  {user.createdAt
                    ? new Date(user.createdAt).toLocaleDateString()
                    : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <p className="text-center text-gunmetal text-sm py-8">
            No users match your search.
          </p>
        )}
      </div>
    </div>
  );
}

function BrokeragesTab() {
  const brokerages = useQuery(api.admin.getAllBrokerages);

  if (!brokerages) return <LoadingState />;

  if (brokerages.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-gunmetal text-sm">No brokerages created yet.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <p className="text-white text-sm">{brokerages.length} total brokerages</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {brokerages.map((b) => (
          <div
            key={b._id}
            className="border border-surface-border bg-surface p-5"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <p
                  className="text-white font-medium"
                  style={{ fontFamily: "var(--font-playfair)" }}
                >
                  {b.name}
                </p>
                <p className="text-gunmetal text-xs mt-1">
                  {b.ownerEmail ?? "Unknown owner"}
                </p>
              </div>
              <span className="text-sulfur text-[8px] tracking-[0.3em] uppercase border border-sulfur/30 px-2 py-1">
                {b.agentCount} agents
              </span>
            </div>
            <div className="flex gap-4 text-xs text-gunmetal">
              {b.mlsName && <span>MLS: {b.mlsName}</span>}
              {b.domain && <span>Domain: {b.domain}</span>}
            </div>
            <p className="text-gunmetal text-[10px] mt-3">
              Created {new Date(b.createdAt).toLocaleDateString()}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function ActivityTab() {
  const activity = useQuery(api.admin.getRecentActivity);

  if (!activity) return <LoadingState />;

  if (activity.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-gunmetal text-sm">No recent activity.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-white text-sm">Recent platform activity</p>

      <div className="border border-surface-border">
        {activity.map((item, i) => (
          <div
            key={i}
            className={`flex items-center gap-4 px-5 py-4 ${
              i < activity.length - 1 ? "border-b border-surface-border/50" : ""
            }`}
          >
            <div
              className={`w-8 h-8 flex items-center justify-center border ${
                item.type === "lead"
                  ? "border-cinnabar/30 text-cinnabar"
                  : "border-sulfur/30 text-sulfur"
              }`}
            >
              {item.type === "lead" ? (
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path
                    d="M7 1a3 3 0 1 1 0 6 3 3 0 0 1 0-6zM2 13v-1a4 4 0 0 1 4-4h2a4 4 0 0 1 4 4v1"
                    stroke="currentColor"
                    strokeWidth="1.25"
                    strokeLinecap="round"
                  />
                </svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path
                    d="M2 12V6l5-4.5L12 6v6H2z"
                    stroke="currentColor"
                    strokeWidth="1.25"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm truncate">{item.description}</p>
              {item.email && (
                <p className="text-gunmetal text-xs">{item.email}</p>
              )}
            </div>
            <div className="text-gunmetal text-xs whitespace-nowrap">
              {formatTimeAgo(item.timestamp)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// --- Shared components ---

function MiniChart({
  data,
  color,
}: {
  data: { date: string; count: number }[];
  color: string;
}) {
  const max = Math.max(...data.map((d) => d.count), 1);
  const total = data.reduce((sum, d) => sum + d.count, 0);

  return (
    <div>
      <div className="flex items-end gap-[2px] h-24">
        {data.map((d, i) => (
          <div
            key={i}
            className="flex-1 min-w-0 group relative"
            title={`${d.date}: ${d.count}`}
          >
            <div
              className="w-full transition-all duration-200 group-hover:opacity-80"
              style={{
                height: `${Math.max((d.count / max) * 100, 2)}%`,
                backgroundColor: d.count > 0 ? color : `${color}15`,
              }}
            />
          </div>
        ))}
      </div>
      <div className="flex justify-between mt-2">
        <span className="text-gunmetal text-[10px]">{data[0]?.date}</span>
        <span className="text-gunmetal text-[10px]">{total} total</span>
        <span className="text-gunmetal text-[10px]">
          {data[data.length - 1]?.date}
        </span>
      </div>
    </div>
  );
}

function ChartSkeleton() {
  return <div className="h-24 bg-surface-border/20 animate-pulse" />;
}

function RoleBadge({ role }: { role?: string }) {
  if (!role) return <span className="text-gunmetal text-[10px]">user</span>;
  const colors: Record<string, string> = {
    broker: "border-cinnabar/40 text-cinnabar",
    agent: "border-sulfur/40 text-sulfur",
    admin: "border-white/40 text-white",
  };
  return (
    <span
      className={`text-[8px] tracking-[0.2em] uppercase border px-2 py-0.5 ${colors[role] ?? "border-gunmetal text-gunmetal"}`}
    >
      {role}
    </span>
  );
}

function StatusBadge({
  active,
  pending,
}: {
  active: boolean;
  pending: boolean;
}) {
  if (pending) {
    return (
      <span className="text-[8px] tracking-[0.2em] uppercase border border-cinnabar/30 text-cinnabar px-2 py-0.5">
        Pending
      </span>
    );
  }
  if (active) {
    return (
      <span className="text-[8px] tracking-[0.2em] uppercase border border-sulfur/30 text-sulfur px-2 py-0.5">
        Active
      </span>
    );
  }
  return (
    <span className="text-[8px] tracking-[0.2em] uppercase border border-gunmetal text-gunmetal px-2 py-0.5">
      Setup
    </span>
  );
}

function LoadingState() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="w-6 h-6 border border-sulfur/30 border-t-sulfur animate-spin" />
    </div>
  );
}

function formatTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return new Date(timestamp).toLocaleDateString();
}
