import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    clerkId: v.string(),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    agentId: v.optional(v.string()),
    mlsName: v.optional(v.string()),
    customApiKey: v.optional(v.string()),
    onboardingComplete: v.boolean(),
    notifyEmail: v.optional(v.boolean()),
    notifySms: v.optional(v.boolean()),
    brokerageId: v.optional(v.id("brokerages")),
    role: v.optional(v.string()),
    createdAt: v.optional(v.number()),
  })
    .index("by_clerk_id", ["clerkId"])
    .index("by_brokerage", ["brokerageId"]),

  brokerages: defineTable({
    name: v.string(),
    ownerClerkId: v.string(),
    logoUrl: v.optional(v.string()),
    primaryColor: v.optional(v.string()),
    accentColor: v.optional(v.string()),
    domain: v.optional(v.string()),
    mlsName: v.optional(v.string()),
    customApiKey: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_owner", ["ownerClerkId"]),

  listings: defineTable({
    clerkId: v.string(),
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
    aiRomantic: v.optional(v.string()),
    aiInvestor: v.optional(v.string()),
    aiFamily: v.optional(v.string()),
    aiGeneratedAt: v.optional(v.number()),
    siteStatus: v.string(),
    lastSynced: v.number(),
    sortOrder: v.optional(v.number()),
    lat: v.optional(v.number()),
    lng: v.optional(v.number()),
  })
    .index("by_clerk_id", ["clerkId"])
    .index("by_owner_listing_id", ["clerkId", "listingId"]),

  sites: defineTable({
    clerkId: v.string(),
    listingId: v.string(),
    subdomain: v.string(),
    customDomain: v.optional(v.string()),
    status: v.string(),
    activeNarrative: v.string(),
    publishedAt: v.optional(v.number()),
  })
    .index("by_clerk_id", ["clerkId"])
    .index("by_owner_listing_id", ["clerkId", "listingId"])
    .index("by_subdomain", ["subdomain"])
    .index("by_custom_domain", ["customDomain"]),

  leads: defineTable({
    clerkId: v.string(),
    siteId: v.id("sites"),
    listingId: v.string(),
    address: v.string(),
    name: v.string(),
    email: v.string(),
    phone: v.optional(v.string()),
    message: v.optional(v.string()),
    preferredDate: v.optional(v.string()),
    submittedAt: v.number(),
    emailSent: v.boolean(),
    status: v.optional(v.string()), // "new" | "contacted" | "archived"
  })
    .index("by_clerkId", ["clerkId"])
    .index("by_listingId", ["listingId"])
    .index("by_site_submitted", ["siteId", "submittedAt"])
    .index("by_site_email", ["siteId", "email", "submittedAt"]),
});
