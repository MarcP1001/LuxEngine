import { v } from "convex/values";
import { action, internalQuery, mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";

function publicBrokerage<T extends { customApiKey?: string }>(brokerage: T) {
  const { customApiKey, ...safeBrokerage } = brokerage;
  return {
    ...safeBrokerage,
    hasCustomApiKey: Boolean(customApiKey),
  };
}

function publicAgent<T extends { customApiKey?: string }>(agent: T) {
  const { customApiKey, ...safeAgent } = agent;
  return {
    ...safeAgent,
    hasCustomApiKey: Boolean(customApiKey),
  };
}

export const getMyBrokerage = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const brokerage = await ctx.db
      .query("brokerages")
      .withIndex("by_owner", (q) => q.eq("ownerClerkId", identity.subject))
      .first();
    return brokerage ? publicBrokerage(brokerage) : null;
  },
});

export const createBrokerage = mutation({
  args: {
    name: v.string(),
    logoUrl: v.optional(v.string()),
    primaryColor: v.optional(v.string()),
    accentColor: v.optional(v.string()),
    mlsName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const existing = await ctx.db
      .query("brokerages")
      .withIndex("by_owner", (q) => q.eq("ownerClerkId", identity.subject))
      .first();
    if (existing) throw new Error("You already have a brokerage");

    const brokerageId = await ctx.db.insert("brokerages", {
      name: args.name,
      ownerClerkId: identity.subject,
      logoUrl: args.logoUrl,
      primaryColor: args.primaryColor ?? "#F2FF00",
      accentColor: args.accentColor ?? "#D35400",
      mlsName: args.mlsName,
      createdAt: Date.now(),
    });

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();
    if (user) {
      await ctx.db.patch(user._id, { brokerageId, role: "broker" });
    }

    return brokerageId;
  },
});

export const updateBrokerage = mutation({
  args: {
    name: v.optional(v.string()),
    logoUrl: v.optional(v.string()),
    primaryColor: v.optional(v.string()),
    accentColor: v.optional(v.string()),
    domain: v.optional(v.string()),
    mlsName: v.optional(v.string()),
    customApiKey: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const brokerage = await ctx.db
      .query("brokerages")
      .withIndex("by_owner", (q) => q.eq("ownerClerkId", identity.subject))
      .first();
    if (!brokerage) throw new Error("No brokerage found");

    const updates: Record<string, unknown> = {};
    if (args.name !== undefined) updates.name = args.name;
    if (args.logoUrl !== undefined) updates.logoUrl = args.logoUrl;
    if (args.primaryColor !== undefined)
      updates.primaryColor = args.primaryColor;
    if (args.accentColor !== undefined) updates.accentColor = args.accentColor;
    if (args.domain !== undefined) updates.domain = args.domain;
    if (args.mlsName !== undefined) updates.mlsName = args.mlsName;
    if (args.customApiKey !== undefined)
      updates.customApiKey = args.customApiKey;

    await ctx.db.patch(brokerage._id, updates);
  },
});

export const addAgent = mutation({
  args: {
    agentId: v.string(),
    email: v.string(),
    mlsName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    const email = args.email.trim().toLowerCase();
    if (!email || !email.includes("@") || email.length > 254) {
      throw new Error("Enter a valid agent email");
    }

    const brokerage = await ctx.db
      .query("brokerages")
      .withIndex("by_owner", (q) => q.eq("ownerClerkId", identity.subject))
      .first();
    if (!brokerage) throw new Error("No brokerage found");

    const existingUser = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), email))
      .first();

    if (existingUser) {
      if (existingUser.brokerageId !== brokerage._id) {
        throw new Error(
          "This email already has an account or belongs to another brokerage",
        );
      }
      await ctx.db.patch(existingUser._id, {
        agentId: args.agentId,
        mlsName: args.mlsName ?? brokerage.mlsName,
        role: "agent",
      });
      return existingUser._id;
    }

    // Create a placeholder user for agents who haven't signed up yet
    const userId = await ctx.db.insert("users", {
      clerkId: `pending-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      email,
      agentId: args.agentId,
      mlsName: args.mlsName ?? brokerage.mlsName,
      brokerageId: brokerage._id,
      role: "agent",
      onboardingComplete: false,
    });

    return userId;
  },
});

export const removeAgent = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const brokerage = await ctx.db
      .query("brokerages")
      .withIndex("by_owner", (q) => q.eq("ownerClerkId", identity.subject))
      .first();
    if (!brokerage) throw new Error("No brokerage found");

    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User not found");

    const isBrokerageId =
      user.brokerageId && user.brokerageId === brokerage._id;
    if (!isBrokerageId) throw new Error("User is not in your brokerage");

    await ctx.db.patch(args.userId, {
      brokerageId: undefined,
      role: undefined,
    });
  },
});

export const getAgents = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const brokerage = await ctx.db
      .query("brokerages")
      .withIndex("by_owner", (q) => q.eq("ownerClerkId", identity.subject))
      .first();
    if (!brokerage) return [];

    const agents = await ctx.db
      .query("users")
      .withIndex("by_brokerage", (q) => q.eq("brokerageId", brokerage._id))
      .collect();
    return agents.map(publicAgent);
  },
});

export const getAgentsForSync = internalQuery({
  args: { ownerClerkId: v.string() },
  handler: async (ctx, args) => {
    const brokerage = await ctx.db
      .query("brokerages")
      .withIndex("by_owner", (q) => q.eq("ownerClerkId", args.ownerClerkId))
      .first();
    if (!brokerage) return [];

    return await ctx.db
      .query("users")
      .withIndex("by_brokerage", (q) => q.eq("brokerageId", brokerage._id))
      .collect();
  },
});

export const getBrokerageStats = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const brokerage = await ctx.db
      .query("brokerages")
      .withIndex("by_owner", (q) => q.eq("ownerClerkId", identity.subject))
      .first();
    if (!brokerage) return null;

    const agents = await ctx.db
      .query("users")
      .withIndex("by_brokerage", (q) => q.eq("brokerageId", brokerage._id))
      .collect();

    const agentClerkIds = new Set(agents.map((a) => a.clerkId));

    let totalListings = 0;
    let liveSites = 0;
    let totalLeads = 0;
    let portfolioValue = 0;

    for (const clerkId of agentClerkIds) {
      const listings = await ctx.db
        .query("listings")
        .withIndex("by_clerk_id", (q) => q.eq("clerkId", clerkId))
        .collect();
      totalListings += listings.length;
      portfolioValue += listings.reduce((sum, l) => sum + l.price, 0);

      const sites = await ctx.db
        .query("sites")
        .withIndex("by_clerk_id", (q) => q.eq("clerkId", clerkId))
        .collect();
      liveSites += sites.filter((s) => s.status === "live").length;

      const leads = await ctx.db
        .query("leads")
        .withIndex("by_clerkId", (q) => q.eq("clerkId", clerkId))
        .collect();
      totalLeads += leads.length;
    }

    return {
      agentCount: agents.length,
      totalListings,
      liveSites,
      totalLeads,
      portfolioValue,
    };
  },
});

export const getBrokerageListings = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const brokerage = await ctx.db
      .query("brokerages")
      .withIndex("by_owner", (q) => q.eq("ownerClerkId", identity.subject))
      .first();
    if (!brokerage) return [];

    const agents = await ctx.db
      .query("users")
      .withIndex("by_brokerage", (q) => q.eq("brokerageId", brokerage._id))
      .collect();

    const allListings = [];
    for (const agent of agents) {
      const listings = await ctx.db
        .query("listings")
        .withIndex("by_clerk_id", (q) => q.eq("clerkId", agent.clerkId))
        .collect();
      for (const listing of listings) {
        allListings.push({
          ...listing,
          agentEmail: agent.email,
          agentName: agent.agentId,
        });
      }
    }

    return allListings;
  },
});

export const getBrokerageLeads = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const brokerage = await ctx.db
      .query("brokerages")
      .withIndex("by_owner", (q) => q.eq("ownerClerkId", identity.subject))
      .first();
    if (!brokerage) return [];

    const agents = await ctx.db
      .query("users")
      .withIndex("by_brokerage", (q) => q.eq("brokerageId", brokerage._id))
      .collect();

    const allLeads = [];
    for (const agent of agents) {
      const leads = await ctx.db
        .query("leads")
        .withIndex("by_clerkId", (q) => q.eq("clerkId", agent.clerkId))
        .order("desc")
        .take(20);
      for (const lead of leads) {
        allLeads.push({
          ...lead,
          agentEmail: agent.email,
          agentId: agent.agentId,
        });
      }
    }

    return allLeads.sort((a, b) => b.submittedAt - a.submittedAt).slice(0, 50);
  },
});

export const syncAllAgents = action({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const agents = await ctx.runQuery(internal.brokerages.getAgentsForSync, {
      ownerClerkId: identity.subject,
    });
    if (agents.length === 0) return 0;
    let synced = 0;

    for (const agent of agents) {
      if (!agent.agentId || !agent.mlsName) continue;
      if (agent.clerkId.startsWith("pending-")) continue;

      try {
        await ctx.runAction(internal.listings.syncOneAgent, {
          clerkId: agent.clerkId,
          agentId: agent.agentId,
          mlsName: agent.mlsName,
          customApiKey: agent.customApiKey,
        });
        synced += 1;
      } catch {
        // Individual agent sync failure shouldn't stop others
      }
    }

    return synced;
  },
});
