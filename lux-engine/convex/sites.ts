import { v } from "convex/values";
import { action, internalQuery, mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";

const DOMAIN_RE =
  /^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)$/;

export const getMySites = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    return await ctx.db
      .query("sites")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .collect();
  },
});

export const getSiteBySubdomain = query({
  args: { subdomain: v.string() },
  handler: async (ctx, { subdomain }) => {
    return await ctx.db
      .query("sites")
      .withIndex("by_subdomain", (q) => q.eq("subdomain", subdomain))
      .filter((q) => q.eq(q.field("status"), "live"))
      .first();
  },
});

export const getSiteByListingId = query({
  args: { listingId: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    return await ctx.db
      .query("sites")
      .withIndex("by_owner_listing_id", (q) =>
        q.eq("clerkId", identity.subject).eq("listingId", args.listingId),
      )
      .first();
  },
});

export const launchSite = mutation({
  args: {
    listingId: v.string(),
    subdomain: v.string(),
    activeNarrative: v.union(
      v.literal("romantic"),
      v.literal("investor"),
      v.literal("family"),
    ),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const listing = await ctx.db
      .query("listings")
      .withIndex("by_owner_listing_id", (q) =>
        q.eq("clerkId", identity.subject).eq("listingId", args.listingId),
      )
      .first();
    if (!listing) throw new Error("Listing not found or not authorized");

    const existing = await ctx.db
      .query("sites")
      .withIndex("by_owner_listing_id", (q) =>
        q.eq("clerkId", identity.subject).eq("listingId", args.listingId),
      )
      .first();

    let siteId;

    if (existing) {
      await ctx.db.patch(existing._id, {
        status: "live",
        activeNarrative: args.activeNarrative,
        publishedAt: Date.now(),
      });
      siteId = existing._id;
    } else {
      // Check for subdomain collision before inserting
      let subdomain = args.subdomain.toLowerCase().trim();
      if (!/^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$/.test(subdomain)) {
        throw new Error("Invalid site subdomain");
      }
      const collision = await ctx.db
        .query("sites")
        .withIndex("by_subdomain", (q) => q.eq("subdomain", subdomain))
        .first();
      if (collision) {
        subdomain = `${subdomain}${Date.now().toString(36).slice(-4)}`;
      }

      siteId = await ctx.db.insert("sites", {
        clerkId: identity.subject,
        listingId: args.listingId,
        subdomain,
        status: "live",
        activeNarrative: args.activeNarrative,
        publishedAt: Date.now(),
      });
    }

    // Update the listing's siteStatus so dashboard stats reflect the launch
    await ctx.db.patch(listing._id, { siteStatus: "published" });

    return siteId;
  },
});

export const updateSiteNarrative = mutation({
  args: {
    siteId: v.id("sites"),
    activeNarrative: v.union(
      v.literal("romantic"),
      v.literal("investor"),
      v.literal("family"),
    ),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const site = await ctx.db.get(args.siteId);
    if (!site || site.clerkId !== identity.subject) {
      throw new Error("Not authorized");
    }
    await ctx.db.patch(args.siteId, { activeNarrative: args.activeNarrative });
  },
});

export const getSiteByCustomDomain = query({
  args: { domain: v.string() },
  handler: async (ctx, { domain }) => {
    const normalizedDomain = domain.toLowerCase().split(":")[0].trim();
    return await ctx.db
      .query("sites")
      .withIndex("by_custom_domain", (q) =>
        q.eq("customDomain", normalizedDomain),
      )
      .filter((q) => q.eq(q.field("status"), "live"))
      .first();
  },
});

export const setCustomDomain = mutation({
  args: { siteId: v.id("sites"), customDomain: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const site = await ctx.db.get(args.siteId);
    if (!site || site.clerkId !== identity.subject) {
      throw new Error("Not authorized");
    }

    // Normalize: lowercase, strip protocol/trailing slash
    const domain = args.customDomain
      .toLowerCase()
      .replace(/^https?:\/\//, "")
      .replace(/\/+$/, "")
      .trim();

    if (!DOMAIN_RE.test(domain)) {
      throw new Error("Enter a valid hostname without a path or port");
    }

    const platformHosts = (
      process.env.LUXENGINE_PLATFORM_HOSTS ?? "luxengine.io,www.luxengine.io"
    )
      .split(",")
      .map((host) => host.trim().toLowerCase());
    if (platformHosts.includes(domain)) {
      throw new Error("The platform domain cannot be used as a custom domain");
    }

    // Check if domain is already taken by another site
    const existing = await ctx.db
      .query("sites")
      .withIndex("by_custom_domain", (q) => q.eq("customDomain", domain))
      .first();
    if (existing && existing._id !== args.siteId) {
      throw new Error("This domain is already connected to another site.");
    }

    await ctx.db.patch(args.siteId, { customDomain: domain });
  },
});

export const removeCustomDomain = mutation({
  args: { siteId: v.id("sites") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const site = await ctx.db.get(args.siteId);
    if (!site || site.clerkId !== identity.subject) {
      throw new Error("Not authorized");
    }

    await ctx.db.patch(args.siteId, { customDomain: undefined });
  },
});

export const verifyDns = action({
  args: { siteId: v.id("sites") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const site = await ctx.runQuery(internal.sites.getOwnedSiteById, {
      siteId: args.siteId,
      ownerClerkId: identity.subject,
    });
    if (!site?.customDomain) {
      return { verified: false, error: "No custom domain set" };
    }

    try {
      const canonicalHost = (
        process.env.LUXENGINE_CANONICAL_HOST ?? "luxengine.io"
      ).toLowerCase();
      const res = await fetch(
        `https://dns.google/resolve?name=${encodeURIComponent(site.customDomain)}&type=CNAME`,
      );
      if (!res.ok) return { verified: false, error: "DNS lookup failed" };

      const data = (await res.json()) as { Answer?: { data: string }[] };
      const answers = data.Answer ?? [];
      const hasCname = answers.some(
        (a) => a.data.replace(/\.$/, "").toLowerCase() === canonicalHost,
      );

      return {
        verified: hasCname,
        records: answers.map((a) => a.data.replace(/\.$/, "")),
        error: hasCname ? null : `CNAME not pointing to ${canonicalHost}`,
      };
    } catch {
      return { verified: false, error: "DNS lookup failed" };
    }
  },
});

export const getOwnedSiteById = internalQuery({
  args: { siteId: v.id("sites"), ownerClerkId: v.string() },
  handler: async (ctx, args) => {
    const site = await ctx.db.get(args.siteId);
    return site?.clerkId === args.ownerClerkId ? site : null;
  },
});

export const takeOffline = mutation({
  args: { siteId: v.id("sites") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const site = await ctx.db.get(args.siteId);
    if (!site || site.clerkId !== identity.subject) {
      throw new Error("Not authorized");
    }
    await ctx.db.patch(args.siteId, { status: "offline" });

    // Reset the listing's siteStatus back to draft
    const listing = await ctx.db
      .query("listings")
      .withIndex("by_owner_listing_id", (q) =>
        q.eq("clerkId", site.clerkId).eq("listingId", site.listingId),
      )
      .first();
    if (listing) {
      await ctx.db.patch(listing._id, { siteStatus: "draft" });
    }
  },
});
