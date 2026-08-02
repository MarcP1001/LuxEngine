import { v } from "convex/values";
import { action } from "./_generated/server";
import { internal } from "./_generated/api";

export const enhanceListing = action({
  args: { listingId: v.id("listings") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const listing = await ctx.runQuery(internal.listings.getOwnedById, {
      id: args.listingId,
      ownerClerkId: identity.subject,
    });
    if (!listing) throw new Error("Listing not found or not authorized");
    if (!listing.publicRemarks) {
      throw new Error("No MLS description available");
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY not configured");
    const model = process.env.GEMINI_MODEL ?? "gemini-3.6-flash";

    const bedsStr =
      listing.beds !== undefined ? `${listing.beds} beds` : "N/A beds";
    const bathsStr =
      listing.baths !== undefined ? `${listing.baths} baths` : "N/A baths";
    const sqFtStr =
      listing.sqFt !== undefined
        ? `${listing.sqFt.toLocaleString()} sq ft`
        : "N/A sq ft";
    const priceStr = `$${listing.price.toLocaleString()}`;

    const prompt = `You are a luxury real estate copywriter for Lux Engine, a high-end marketing platform. Rewrite the MLS listing description below into THREE distinct narratives.

Property: ${listing.address}, ${listing.city}, ${listing.state}
Price: ${priceStr} | ${bedsStr} | ${bathsStr} | ${sqFtStr}
Original MLS remarks: "${listing.publicRemarks}"

Return a JSON object with exactly these three keys:
- "romantic": An evocative, lifestyle-driven narrative (3-4 sentences). Emphasize beauty, ambiance, and the emotional experience of living there. Use elevated language.
- "investor": A data-driven, ROI-focused narrative (3-4 sentences). Emphasize location value, income potential, appreciation, and market position.
- "family": A warm, practical narrative (3-4 sentences). Emphasize space, safety, community, schools, and livability.

Return only valid JSON. No markdown code blocks, no extra text.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.8,
            maxOutputTokens: 1024,
            responseMimeType: "application/json",
            responseJsonSchema: {
              type: "object",
              properties: {
                romantic: { type: "string" },
                investor: { type: "string" },
                family: { type: "string" },
              },
              required: ["romantic", "investor", "family"],
              additionalProperties: false,
            },
          },
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const result = await response.json() as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };
    const text = result.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

    let narratives: { romantic: string; investor: string; family: string };
    try {
      narratives = JSON.parse(text.trim());
    } catch {
      // Try to extract JSON from the response in case Gemini added extra text
      const match = text.match(/\{[\s\S]*\}/);
      if (!match) throw new Error("Failed to parse AI response");
      narratives = JSON.parse(match[0]);
    }

    if (
      typeof narratives.romantic !== "string" ||
      typeof narratives.investor !== "string" ||
      typeof narratives.family !== "string"
    ) {
      throw new Error("AI response did not contain valid narratives");
    }

    await ctx.runMutation(internal.listings.updateAiDescriptions, {
      id: args.listingId,
      ownerClerkId: identity.subject,
      aiRomantic: narratives.romantic,
      aiInvestor: narratives.investor,
      aiFamily: narratives.family,
    });

    return narratives;
  },
});
