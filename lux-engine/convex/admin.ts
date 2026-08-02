import { query } from "./_generated/server";

function superadminEmails(): Set<string> {
  return new Set(
    (process.env.SUPERADMIN_EMAILS ?? "")
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean)
  );
}

async function requireSuperadmin(ctx: {
  auth: {
    getUserIdentity: () => Promise<{
      email?: string;
      emailVerified?: boolean;
    } | null>;
  };
}) {
  const identity = await ctx.auth.getUserIdentity();
  if (
    !identity?.email ||
    identity.emailVerified !== true ||
    !superadminEmails().has(identity.email.toLowerCase())
  ) {
    throw new Error("Unauthorized");
  }
  return identity;
}

export const isSuperadmin = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.email || identity.emailVerified !== true) return false;
    return superadminEmails().has(identity.email.toLowerCase());
  },
});

export const getPlatformStats = query({
  args: {},
  handler: async (ctx) => {
    await requireSuperadmin(ctx);

    const allUsers = await ctx.db.query("users").collect();
    const allListings = await ctx.db.query("listings").collect();
    const allSites = await ctx.db.query("sites").collect();
    const allLeads = await ctx.db.query("leads").collect();
    const allBrokerages = await ctx.db.query("brokerages").collect();

    const liveSites = allSites.filter((s) => s.status === "live");
    const activeListings = allListings.filter((l) => l.status === "active");
    const publishedListings = allListings.filter((l) => l.siteStatus === "published");
    const onboardedUsers = allUsers.filter((u) => u.onboardingComplete);
    const portfolioValue = allListings.reduce((sum, l) => sum + l.price, 0);

    const now = Date.now();
    const dayAgo = now - 86_400_000;
    const weekAgo = now - 7 * 86_400_000;
    const monthAgo = now - 30 * 86_400_000;

    const usersToday = allUsers.filter((u) => u.createdAt && u.createdAt > dayAgo).length;
    const usersThisWeek = allUsers.filter((u) => u.createdAt && u.createdAt > weekAgo).length;
    const usersThisMonth = allUsers.filter((u) => u.createdAt && u.createdAt > monthAgo).length;

    const leadsToday = allLeads.filter((l) => l.submittedAt > dayAgo).length;
    const leadsThisWeek = allLeads.filter((l) => l.submittedAt > weekAgo).length;
    const leadsThisMonth = allLeads.filter((l) => l.submittedAt > monthAgo).length;

    const sitesThisWeek = allSites.filter((s) => s.publishedAt && s.publishedAt > weekAgo).length;

    // Revenue projections based on onboarded users × $100/mo ($1,200/yr)
    const activeSubscribers = onboardedUsers.filter((u) => !u.clerkId.startsWith("pending-")).length;
    const mrr = activeSubscribers * 100;
    const arr = mrr * 12;

    return {
      totalUsers: allUsers.length,
      onboardedUsers: onboardedUsers.length,
      totalListings: allListings.length,
      activeListings: activeListings.length,
      publishedListings: publishedListings.length,
      totalSites: allSites.length,
      liveSites: liveSites.length,
      totalLeads: allLeads.length,
      totalBrokerages: allBrokerages.length,
      portfolioValue,
      usersToday,
      usersThisWeek,
      usersThisMonth,
      leadsToday,
      leadsThisWeek,
      leadsThisMonth,
      sitesThisWeek,
      activeSubscribers,
      mrr,
      arr,
    };
  },
});

export const getUserGrowth = query({
  args: {},
  handler: async (ctx) => {
    await requireSuperadmin(ctx);

    const allUsers = await ctx.db.query("users").collect();
    const now = Date.now();
    const thirtyDaysAgo = now - 30 * 86_400_000;

    const dailyCounts: Record<string, number> = {};
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now - i * 86_400_000);
      const key = `${date.getMonth() + 1}/${date.getDate()}`;
      dailyCounts[key] = 0;
    }

    for (const user of allUsers) {
      if (!user.createdAt || user.createdAt < thirtyDaysAgo) continue;
      const date = new Date(user.createdAt);
      const key = `${date.getMonth() + 1}/${date.getDate()}`;
      if (key in dailyCounts) dailyCounts[key]++;
    }

    return Object.entries(dailyCounts).map(([date, count]) => ({ date, count }));
  },
});

export const getAllUsers = query({
  args: {},
  handler: async (ctx) => {
    await requireSuperadmin(ctx);

    const users = await ctx.db.query("users").collect();
    const enriched = [];

    for (const user of users) {
      const listings = await ctx.db
        .query("listings")
        .withIndex("by_clerk_id", (q) => q.eq("clerkId", user.clerkId))
        .collect();
      const sites = await ctx.db
        .query("sites")
        .withIndex("by_clerk_id", (q) => q.eq("clerkId", user.clerkId))
        .collect();
      const leads = await ctx.db
        .query("leads")
        .withIndex("by_clerkId", (q) => q.eq("clerkId", user.clerkId))
        .collect();

      let brokerageName: string | undefined;
      if (user.brokerageId) {
        const brokerage = await ctx.db.get(user.brokerageId);
        brokerageName = brokerage?.name;
      }

      enriched.push({
        _id: user._id,
        email: user.email,
        clerkId: user.clerkId,
        agentId: user.agentId,
        mlsName: user.mlsName,
        role: user.role,
        onboardingComplete: user.onboardingComplete,
        createdAt: user.createdAt,
        brokerageName,
        listingCount: listings.length,
        liveCount: sites.filter((s) => s.status === "live").length,
        leadCount: leads.length,
        portfolioValue: listings.reduce((sum, l) => sum + l.price, 0),
      });
    }

    return enriched.sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
  },
});

export const getAllBrokerages = query({
  args: {},
  handler: async (ctx) => {
    await requireSuperadmin(ctx);

    const brokerages = await ctx.db.query("brokerages").collect();
    const enriched = [];

    for (const b of brokerages) {
      const agents = await ctx.db
        .query("users")
        .withIndex("by_brokerage", (q) => q.eq("brokerageId", b._id))
        .collect();

      const owner = await ctx.db
        .query("users")
        .withIndex("by_clerk_id", (q) => q.eq("clerkId", b.ownerClerkId))
        .first();
      const ownerEmail = owner?.email;

      enriched.push({
        _id: b._id,
        name: b.name,
        ownerEmail,
        domain: b.domain,
        mlsName: b.mlsName,
        agentCount: agents.length,
        createdAt: b.createdAt,
      });
    }

    return enriched.sort((a, b) => b.createdAt - a.createdAt);
  },
});

export const getRecentActivity = query({
  args: {},
  handler: async (ctx) => {
    await requireSuperadmin(ctx);

    const recentLeads = await ctx.db.query("leads").order("desc").take(20);
    const recentSites = await ctx.db.query("sites").order("desc").take(20);

    const leadActivity = recentLeads.map((l) => ({
      type: "lead" as const,
      description: `${l.name} inquired about ${l.address}`,
      email: l.email,
      timestamp: l.submittedAt,
    }));

    const siteActivity = recentSites
      .filter((s) => s.publishedAt)
      .map((s) => ({
        type: "site_launch" as const,
        description: `Site launched: ${s.subdomain}`,
        email: "",
        timestamp: s.publishedAt!,
      }));

    return [...leadActivity, ...siteActivity]
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 30);
  },
});

export const getLeadsByDay = query({
  args: {},
  handler: async (ctx) => {
    await requireSuperadmin(ctx);

    const allLeads = await ctx.db.query("leads").collect();
    const now = Date.now();

    const dailyCounts: Record<string, number> = {};
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now - i * 86_400_000);
      const key = `${date.getMonth() + 1}/${date.getDate()}`;
      dailyCounts[key] = 0;
    }

    const thirtyDaysAgo = now - 30 * 86_400_000;
    for (const lead of allLeads) {
      if (lead.submittedAt < thirtyDaysAgo) continue;
      const date = new Date(lead.submittedAt);
      const key = `${date.getMonth() + 1}/${date.getDate()}`;
      if (key in dailyCounts) dailyCounts[key]++;
    }

    return Object.entries(dailyCounts).map(([date, count]) => ({ date, count }));
  },
});
