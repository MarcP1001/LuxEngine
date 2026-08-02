import { ConvexError, v } from "convex/values";
import {
  mutation,
  query,
  internalAction,
  internalMutation,
  internalQuery,
} from "./_generated/server";
import { internal } from "./_generated/api";

const MAX_LEADS_PER_SITE_WINDOW = 5;
const LEAD_WINDOW_MS = 10 * 60 * 1000;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function requireText(value: string, field: string, maxLength: number): string {
  const trimmed = value.trim();
  if (!trimmed) throw new ConvexError(`${field} is required`);
  if (trimmed.length > maxLength) {
    throw new ConvexError(`${field} must be ${maxLength} characters or fewer`);
  }
  return trimmed;
}

function optionalText(
  value: string | undefined,
  field: string,
  maxLength: number,
): string | undefined {
  if (value === undefined) return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  if (trimmed.length > maxLength) {
    throw new ConvexError(`${field} must be ${maxLength} characters or fewer`);
  }
  return trimmed;
}

function escapeHtml(value: string): string {
  return value.replace(
    /[&<>"']/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[character] ?? character,
  );
}

/* ─── Public mutation — no auth required ───────────────────── */

export const submitLead = mutation({
  args: {
    siteId: v.id("sites"),
    name: v.string(),
    email: v.string(),
    phone: v.optional(v.string()),
    message: v.optional(v.string()),
    preferredDate: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const site = await ctx.db.get(args.siteId);
    if (!site || site.status !== "live") {
      throw new ConvexError("This property site is not accepting requests");
    }

    const name = requireText(args.name, "Name", 100);
    const email = requireText(args.email, "Email", 254).toLowerCase();
    if (!EMAIL_RE.test(email)) throw new ConvexError("Enter a valid email");
    const phone = optionalText(args.phone, "Phone", 40);
    const message = optionalText(args.message, "Message", 2000);
    const preferredDate = optionalText(
      args.preferredDate,
      "Preferred date",
      20,
    );

    const windowStart = Date.now() - LEAD_WINDOW_MS;
    const recentSiteLeads = await ctx.db
      .query("leads")
      .withIndex("by_site_submitted", (q) =>
        q.eq("siteId", args.siteId).gte("submittedAt", windowStart),
      )
      .take(MAX_LEADS_PER_SITE_WINDOW);
    if (recentSiteLeads.length >= MAX_LEADS_PER_SITE_WINDOW) {
      throw new ConvexError("Too many requests. Please try again later.");
    }

    const recentMatchingEmail = await ctx.db
      .query("leads")
      .withIndex("by_site_email", (q) =>
        q
          .eq("siteId", args.siteId)
          .eq("email", email)
          .gte("submittedAt", windowStart),
      )
      .first();
    if (recentMatchingEmail) {
      throw new ConvexError("Your request was already received");
    }

    const listing = await ctx.db
      .query("listings")
      .withIndex("by_owner_listing_id", (q) =>
        q.eq("clerkId", site.clerkId).eq("listingId", site.listingId),
      )
      .first();

    const leadId = await ctx.db.insert("leads", {
      clerkId: site.clerkId,
      siteId: args.siteId,
      listingId: site.listingId,
      address: listing?.address ?? site.listingId,
      name,
      email,
      phone,
      message,
      preferredDate,
      submittedAt: Date.now(),
      emailSent: false,
      status: "new",
    });

    // Schedule email notification (non-blocking — lead is saved regardless)
    await ctx.scheduler.runAfter(0, internal.leads.notifyAgent, { leadId });

    return leadId;
  },
});

/* ─── Authenticated query — dashboard ──────────────────────── */

export const getMyLeads = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    return await ctx.db
      .query("leads")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .order("desc")
      .take(50);
  },
});

/* ─── Lead status management ─────────────────────────────── */

export const updateLeadStatus = mutation({
  args: {
    leadId: v.id("leads"),
    status: v.union(
      v.literal("new"),
      v.literal("contacted"),
      v.literal("archived"),
    ),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const lead = await ctx.db.get(args.leadId);
    if (!lead || lead.clerkId !== identity.subject)
      throw new Error("Not authorized");

    await ctx.db.patch(args.leadId, { status: args.status });
  },
});

/* ─── Internal helpers ──────────────────────────────────────── */

export const getLead = internalQuery({
  args: { leadId: v.id("leads") },
  handler: async (ctx, { leadId }) => {
    return await ctx.db.get(leadId);
  },
});

export const getAgentContact = internalQuery({
  args: { clerkId: v.string() },
  handler: async (ctx, { clerkId }) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", clerkId))
      .unique();
    return {
      email: user?.email ?? null,
      phone: user?.phone ?? null,
      notifyEmail: user?.notifyEmail !== false,
      notifySms: user?.notifySms === true,
    };
  },
});

export const markEmailSent = internalMutation({
  args: { leadId: v.id("leads") },
  handler: async (ctx, { leadId }) => {
    await ctx.db.patch(leadId, { emailSent: true });
  },
});

/* ─── Internal action — Resend email notification ───────────── */

export const notifyAgent = internalAction({
  args: { leadId: v.id("leads") },
  handler: async (ctx, { leadId }) => {
    const lead = await ctx.runQuery(internal.leads.getLead, { leadId });
    if (!lead) return;

    const contact = await ctx.runQuery(internal.leads.getAgentContact, {
      clerkId: lead.clerkId,
    });

    let sent = false;
    const resendFromEmail = process.env.RESEND_FROM_EMAIL;

    // Email notification via Resend
    if (
      contact.notifyEmail &&
      contact.email &&
      process.env.RESEND_API_KEY &&
      resendFromEmail
    ) {
      const safeName = escapeHtml(lead.name);
      const safeAddress = escapeHtml(lead.address);
      const safeEmail = escapeHtml(lead.email);
      const phoneRow = lead.phone
        ? `<p style="margin:0 0 8px;"><strong>Phone:</strong> ${escapeHtml(lead.phone)}</p>`
        : "";
      const dateRow = lead.preferredDate
        ? `<p style="margin:0 0 8px;"><strong>Preferred Date:</strong> ${escapeHtml(lead.preferredDate)}</p>`
        : "";
      const msgRow = lead.message
        ? `<p style="margin:0 0 8px;"><strong>Message:</strong> ${escapeHtml(lead.message)}</p>`
        : "";

      const html = `
<div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#111;">
  <div style="background:#1A1A1A;padding:24px 32px;border-bottom:2px solid #F2FF00;">
    <p style="color:#F2FF00;font-size:11px;letter-spacing:0.3em;text-transform:uppercase;margin:0;">
      Lux Engine &mdash; New Lead
    </p>
  </div>
  <div style="background:#222222;padding:32px;color:#ffffff;">
    <h2 style="color:#ffffff;font-size:22px;margin:0 0 6px;">${safeName} wants a tour</h2>
    <p style="color:#54585A;font-size:14px;margin:0 0 28px;">${safeAddress}</p>
    <div style="border-top:1px solid #333;padding-top:24px;">
      <p style="margin:0 0 8px;">
        <strong>Email:</strong>
        <a href="mailto:${safeEmail}" style="color:#F2FF00;">${safeEmail}</a>
      </p>
      ${phoneRow}
      ${dateRow}
      ${msgRow}
    </div>
  </div>
  <div style="background:#1A1A1A;padding:16px 32px;text-align:center;">
    <p style="color:#54585A;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;margin:0;">
      Lux Engine &middot; Luxury Real Estate Marketing
    </p>
  </div>
</div>`;

      try {
        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: resendFromEmail,
            to: [contact.email],
            subject: `New Tour Request — ${lead.address}`,
            html,
          }),
        });
        if (res.ok) sent = true;
      } catch {
        // Email failed — continue to SMS
      }
    }

    // SMS notification via Twilio
    if (contact.notifySms && contact.phone && process.env.TWILIO_ACCOUNT_SID) {
      const sid = process.env.TWILIO_ACCOUNT_SID;
      const token = process.env.TWILIO_AUTH_TOKEN;
      const from = process.env.TWILIO_PHONE_NUMBER;
      if (sid && token && from) {
        const body = `🏡 Lux Engine — New Lead\n${lead.name} wants a tour of ${lead.address}\nEmail: ${lead.email}${lead.phone ? `\nPhone: ${lead.phone}` : ""}${lead.message ? `\nMsg: ${lead.message}` : ""}`;

        try {
          const res = await fetch(
            `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
            {
              method: "POST",
              headers: {
                Authorization: `Basic ${btoa(`${sid}:${token}`)}`,
                "Content-Type": "application/x-www-form-urlencoded",
              },
              body: new URLSearchParams({
                From: from,
                To: contact.phone,
                Body: body,
              }),
            },
          );
          if (res.ok) sent = true;
        } catch {
          // SMS failed — lead is stored in DB regardless
        }
      }
    }

    if (sent) {
      await ctx.runMutation(internal.leads.markEmailSent, { leadId });
    }
  },
});
