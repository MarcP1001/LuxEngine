import { v } from "convex/values";
import {
  query,
  mutation,
  action,
  internalAction,
  internalMutation,
  internalQuery,
} from "./_generated/server";
import { internal } from "./_generated/api";

const syncedListingValidator = v.object({
  listingId: v.string(),
  address: v.string(),
  city: v.string(),
  state: v.string(),
  zip: v.string(),
  price: v.number(),
  beds: v.optional(v.number()),
  baths: v.optional(v.number()),
  sqFt: v.optional(v.number()),
  publicRemarks: v.optional(v.string()),
  images: v.array(v.string()),
  listingOfficeName: v.optional(v.string()),
  mlsName: v.optional(v.string()),
  agentId: v.optional(v.string()),
  propType: v.optional(v.string()),
  yearBuilt: v.optional(v.number()),
  status: v.string(),
  lastSynced: v.number(),
});

type SyncedListingData = {
  listingId: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  price: number;
  beds?: number;
  baths?: number;
  sqFt?: number;
  publicRemarks?: string;
  images: string[];
  listingOfficeName?: string;
  mlsName?: string;
  agentId?: string;
  propType?: string;
  yearBuilt?: number;
  status: string;
  lastSynced: number;
};

function normalizeIdxListing(
  raw: Record<string, unknown>,
  listingId: string,
  agentId: string,
  mlsName: string
): SyncedListingData {
  const normalized: SyncedListingData = {
    listingId,
    address: String(raw.address ?? raw.streetAddress ?? ""),
    city: String(raw.city ?? ""),
    state: String(raw.state ?? raw.stateOrProvince ?? ""),
    zip: String(raw.zip ?? raw.postalCode ?? ""),
    price: Number(raw.listPrice ?? raw.price ?? 0),
    images: Array.isArray(raw.images)
      ? raw.images.filter((image): image is string => typeof image === "string")
      : typeof raw.image === "string"
        ? [raw.image]
        : [],
    status: String(raw.status ?? "active"),
    mlsName,
    agentId,
    lastSynced: Date.now(),
  };

  if (raw.bedrooms !== undefined) normalized.beds = Number(raw.bedrooms);
  if (raw.totalBaths !== undefined) normalized.baths = Number(raw.totalBaths);
  if (raw.sqFt !== undefined) normalized.sqFt = Number(raw.sqFt);
  if (raw.publicRemarks ?? raw.remarks) {
    normalized.publicRemarks = String(raw.publicRemarks ?? raw.remarks);
  }
  if (raw.listingOfficeName ?? raw.officeName) {
    normalized.listingOfficeName = String(
      raw.listingOfficeName ?? raw.officeName
    );
  }
  if (raw.propType ?? raw.propertyType) {
    normalized.propType = String(raw.propType ?? raw.propertyType);
  }
  if (raw.yearBuilt !== undefined) normalized.yearBuilt = Number(raw.yearBuilt);

  return normalized;
}

export const getMyListings = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    return await ctx.db
      .query("listings")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .collect();
  },
});

export const getPublicBySiteId = query({
  args: { siteId: v.id("sites") },
  handler: async (ctx, args) => {
    const site = await ctx.db.get(args.siteId);
    if (!site || site.status !== "live") return null;

    return await ctx.db
      .query("listings")
      .withIndex("by_owner_listing_id", (q) =>
        q.eq("clerkId", site.clerkId).eq("listingId", site.listingId)
      )
      .first();
  },
});

export const getOwnedById = internalQuery({
  args: { id: v.id("listings"), ownerClerkId: v.string() },
  handler: async (ctx, args) => {
    const listing = await ctx.db.get(args.id);
    return listing?.clerkId === args.ownerClerkId ? listing : null;
  },
});

export const upsertSyncedListing = internalMutation({
  args: {
    ownerClerkId: v.string(),
    data: syncedListingValidator,
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("listings")
      .withIndex("by_owner_listing_id", (q) =>
        q
          .eq("clerkId", args.ownerClerkId)
          .eq("listingId", args.data.listingId)
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, args.data);
      return existing._id;
    }

    return await ctx.db.insert("listings", {
      clerkId: args.ownerClerkId,
      siteStatus: "draft",
      ...args.data,
    });
  },
});

export const updateAiDescriptions = internalMutation({
  args: {
    id: v.id("listings"),
    ownerClerkId: v.string(),
    aiRomantic: v.string(),
    aiInvestor: v.string(),
    aiFamily: v.string(),
  },
  handler: async (ctx, args) => {
    const listing = await ctx.db.get(args.id);
    if (!listing || listing.clerkId !== args.ownerClerkId) {
      throw new Error("Not authorized");
    }

    await ctx.db.patch(args.id, {
      aiRomantic: args.aiRomantic,
      aiInvestor: args.aiInvestor,
      aiFamily: args.aiFamily,
      aiGeneratedAt: Date.now(),
    });
  },
});

export const updateGeocode = internalMutation({
  args: {
    id: v.id("listings"),
    ownerClerkId: v.string(),
    lat: v.number(),
    lng: v.number(),
  },
  handler: async (ctx, args) => {
    const listing = await ctx.db.get(args.id);
    if (!listing || listing.clerkId !== args.ownerClerkId) {
      throw new Error("Not authorized");
    }
    await ctx.db.patch(args.id, { lat: args.lat, lng: args.lng });
  },
});

export const deleteListing = mutation({
  args: { id: v.id("listings") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    const listing = await ctx.db.get(args.id);
    if (!listing || listing.clerkId !== identity.subject) throw new Error("Not authorized");
    await ctx.db.delete(args.id);
  },
});

export const resetMyListings = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const listings = await ctx.db
      .query("listings")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .collect();

    for (const listing of listings) {
      await ctx.db.delete(listing._id);
    }
    return listings.length;
  },
});

export const addManualListing = mutation({
  args: {
    address: v.string(),
    city: v.string(),
    state: v.string(),
    zip: v.string(),
    price: v.number(),
    beds: v.optional(v.number()),
    baths: v.optional(v.number()),
    sqFt: v.optional(v.number()),
    publicRemarks: v.optional(v.string()),
    images: v.array(v.string()),
    listingOfficeName: v.optional(v.string()),
    mlsName: v.optional(v.string()),
    propType: v.optional(v.string()),
    yearBuilt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    const listingId = `manual-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    return await ctx.db.insert("listings", {
      clerkId: identity.subject,
      listingId,
      agentId: user?.agentId ?? undefined,
      status: "active",
      siteStatus: "draft",
      lastSynced: Date.now(),
      ...args,
    });
  },
});

const DEMO_LISTINGS = [
  {
    address: "7832 E Camelback Road",
    city: "Scottsdale",
    state: "AZ",
    zip: "85251",
    price: 3_495_000,
    beds: 5,
    baths: 5.5,
    sqFt: 6200,
    propType: "Single Family",
    yearBuilt: 2019,
    publicRemarks: "Stunning contemporary estate with panoramic mountain views, resort-style pool, and chef's kitchen. New construction with premium finishes throughout. Temperature-controlled wine cellar, smart home automation, and a cantilevered infinity pool.",
    images: ["https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&q=90"] as string[],
    listingOfficeName: "Russ Lyon Sotheby's International Realty",
    mlsName: "ARMLS",
  },
  {
    address: "24601 N 104th Place",
    city: "Scottsdale",
    state: "AZ",
    zip: "85255",
    price: 1_875_000,
    beds: 4,
    baths: 3.5,
    sqFt: 4100,
    propType: "Single Family",
    yearBuilt: 2016,
    publicRemarks: "Beautifully updated home in guard-gated community. Open floor plan with soaring ceilings, updated kitchen with quartz counters, and resort backyard with pool and spa.",
    images: ["https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=900&q=85"] as string[],
    listingOfficeName: "Russ Lyon Sotheby's International Realty",
    mlsName: "ARMLS",
  },
  {
    address: "5901 N Pima Road",
    city: "Scottsdale",
    state: "AZ",
    zip: "85250",
    price: 2_250_000,
    beds: 3,
    baths: 3,
    sqFt: 3480,
    propType: "Penthouse",
    yearBuilt: 2021,
    publicRemarks: "Rare penthouse opportunity with unobstructed views of the McDowell Mountains. Private rooftop terrace, chef's kitchen, and concierge services. Premium building amenities including fitness center and pool.",
    images: ["https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=900&q=85"] as string[],
    listingOfficeName: "Russ Lyon Sotheby's International Realty",
    mlsName: "ARMLS",
  },
];

export const seedDemoListings = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const existing = await ctx.db
      .query("listings")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (existing) throw new Error("Listings already exist — reset first to re-seed.");

    for (const demo of DEMO_LISTINGS) {
      const listingId = `demo-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      await ctx.db.insert("listings", {
        clerkId: identity.subject,
        listingId,
        status: "active",
        siteStatus: "draft",
        lastSynced: Date.now(),
        ...demo,
      });
    }

    return DEMO_LISTINGS.length;
  },
});

// Verifies an agent ID exists by fetching the first matching listing.
// Returns a preview listing object or null if not found.
export const verifyAgent = action({
  args: {
    agentId: v.string(),
    mlsName: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.runQuery(internal.users.getPrivateByClerkId, {
      clerkId: identity.subject,
    });
    const apiKey = user?.customApiKey ?? process.env.MASTER_IDX_KEY;

    if (!apiKey) {
      throw new Error("NO_KEY");
    }

    const endpoint = user?.customApiKey
      ? "https://api.idxbroker.com/clients/featured"
      : "https://api.idxbroker.com/clients/search";

    const url = `${endpoint}?agentID=${encodeURIComponent(args.agentId)}&status=active&outputtype=json&limit=1`;

    const response = await fetch(url, {
      headers: {
        accesskey: apiKey,
        outputtype: "json",
        apiversion: "1.6.2",
      },
    });

    if (response.status === 401 || response.status === 403) {
      throw new Error("IDX API key invalid or expired.");
    }
    if (!response.ok) {
      throw new Error(`IDX API error: ${response.status}`);
    }

    const data = await response.json();
    const entries = Array.isArray(data) ? data : Object.values(data as Record<string, unknown>);
    const raw = entries[0] as Record<string, unknown> | undefined;

    if (!raw) return null;

    return {
      listingId: String(raw.listingID ?? raw.id ?? ""),
      address: String(raw.address ?? raw.streetAddress ?? ""),
      city: String(raw.city ?? ""),
      state: String(raw.state ?? raw.stateOrProvince ?? ""),
      price: Number(raw.listPrice ?? raw.price ?? 0),
      image: Array.isArray(raw.images)
        ? (raw.images[0] as string | null) ?? null
        : (raw.image as string | null) ?? null,
      agentName: String(raw.listingAgentFullName ?? raw.agentName ?? ""),
    };
  },
});

// Fetches all listings for the agent from IDX Broker and upserts them into Convex.
export const syncListings = action({
  args: {
    agentId: v.string(),
    mlsName: v.string(),
  },
  handler: async (ctx, args): Promise<number> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.runQuery(internal.users.getPrivateByClerkId, {
      clerkId: identity.subject,
    });
    if (
      !user ||
      user.agentId !== args.agentId ||
      user.mlsName !== args.mlsName
    ) {
      throw new Error("Agent identity does not match your profile");
    }
    const apiKey = user?.customApiKey ?? process.env.MASTER_IDX_KEY;

    if (!apiKey) {
      throw new Error("NO_KEY");
    }

    const endpoint: string = user?.customApiKey
      ? "https://api.idxbroker.com/clients/featured"
      : "https://api.idxbroker.com/clients/search";

    const url = `${endpoint}?agentID=${encodeURIComponent(args.agentId)}&status=active&outputtype=json`;

    const response = await fetch(url, {
      headers: {
        accesskey: apiKey,
        outputtype: "json",
        apiversion: "1.6.2",
      },
    });

    if (!response.ok) {
      throw new Error(`IDX API error: ${response.status}`);
    }

    const data = await response.json();
    const rawListings = Array.isArray(data)
      ? (data as Record<string, unknown>[])
      : (Object.values(data as Record<string, unknown>) as Record<string, unknown>[]);

    for (const raw of rawListings) {
      const listingId = String(raw.listingID ?? raw.id ?? "");
      if (!listingId) continue;

      const normalized = normalizeIdxListing(
        raw,
        listingId,
        args.agentId,
        args.mlsName
      );
      await ctx.runMutation(internal.listings.upsertSyncedListing, {
        ownerClerkId: identity.subject,
        data: normalized,
      });
    }

    return rawListings.length;
  },
});

export const updateNarrative = mutation({
  args: {
    listingId: v.string(),
    narrative: v.union(v.literal("romantic"), v.literal("investor"), v.literal("family")),
    text: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const listing = await ctx.db
      .query("listings")
      .withIndex("by_owner_listing_id", (q) =>
        q
          .eq("clerkId", identity.subject)
          .eq("listingId", args.listingId)
      )
      .first();

    if (!listing || listing.clerkId !== identity.subject) throw new Error("Not authorized");

    const field = args.narrative === "romantic" ? "aiRomantic"
      : args.narrative === "investor" ? "aiInvestor"
      : "aiFamily";

    await ctx.db.patch(listing._id, { [field]: args.text });
  },
});

// Reorder listings — accepts an array of { id, sortOrder } pairs
export const reorderListings = mutation({
  args: {
    items: v.array(v.object({ id: v.id("listings"), sortOrder: v.number() })),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    for (const item of args.items) {
      const listing = await ctx.db.get(item.id);
      if (listing && listing.clerkId === identity.subject) {
        await ctx.db.patch(item.id, { sortOrder: item.sortOrder });
      }
    }
  },
});

// Geocode a listing's address and store lat/lng
export const geocodeListing = action({
  args: { id: v.id("listings") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const listing = await ctx.runQuery(internal.listings.getOwnedById, {
      id: args.id,
      ownerClerkId: identity.subject,
    });
    if (!listing) return;
    if (listing.lat !== undefined && listing.lng !== undefined) return; // already geocoded

    const query = encodeURIComponent(
      `${listing.address}, ${listing.city}, ${listing.state} ${listing.zip}`
    );
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${query}`,
      { headers: { "User-Agent": "LuxEngine/1.0" } }
    );
    if (!res.ok) return;

    const data = (await res.json()) as { lat: string; lon: string }[];
    if (data.length === 0) return;

    await ctx.runMutation(internal.listings.updateGeocode, {
      id: args.id,
      ownerClerkId: identity.subject,
      lat: parseFloat(data[0].lat),
      lng: parseFloat(data[0].lon),
    });
  },
});

/* ─── Scheduled Auto-Sync ──────────────────────────────────── */

// Returns all users who have completed onboarding and have an agentId
export const getAgentsToSync = internalQuery({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();
    return users.filter((u) => u.onboardingComplete && u.agentId && u.mlsName);
  },
});

// Syncs listings for a single agent (called by the cron scheduler)
export const syncOneAgent = internalAction({
  args: { clerkId: v.string(), agentId: v.string(), mlsName: v.string(), customApiKey: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const apiKey = args.customApiKey ?? process.env.MASTER_IDX_KEY;
    if (!apiKey) return;

    const endpoint = args.customApiKey
      ? "https://api.idxbroker.com/clients/featured"
      : "https://api.idxbroker.com/clients/search";

    const url = `${endpoint}?agentID=${encodeURIComponent(args.agentId)}&status=active&outputtype=json`;

    try {
      const response = await fetch(url, {
        headers: { accesskey: apiKey, outputtype: "json", apiversion: "1.6.2" },
      });
      if (!response.ok) return;

      const data = await response.json();
      const rawListings = Array.isArray(data)
        ? (data as Record<string, unknown>[])
        : (Object.values(data as Record<string, unknown>) as Record<string, unknown>[]);

      for (const raw of rawListings) {
        const listingId = String(raw.listingID ?? raw.id ?? "");
        if (!listingId) continue;

        const normalized = normalizeIdxListing(
          raw,
          listingId,
          args.agentId,
          args.mlsName
        );
        await ctx.runMutation(internal.listings.upsertSyncedListing, {
          ownerClerkId: args.clerkId,
          data: normalized,
        });
      }
    } catch {
      // Silent fail for individual agent — don't block other agents
    }
  },
});

// Master sync job — iterates all onboarded agents and syncs each
export const autoSyncAll = internalAction({
  args: {},
  handler: async (ctx) => {
    const agents = await ctx.runQuery(internal.listings.getAgentsToSync);
    for (const agent of agents) {
      await ctx.runAction(internal.listings.syncOneAgent, {
        clerkId: agent.clerkId,
        agentId: agent.agentId!,
        mlsName: agent.mlsName!,
        customApiKey: agent.customApiKey,
      });
    }
  },
});
