## Context Files — Priority Order

1. **`requirements_v2.md`** — Authoritative product spec (v4.0).
   This is the PRIMARY source of truth for all product behavior,
   data models, UI specs, business rules, and automation logic.
   When any instruction here conflicts with this file,
   `requirements_v2.md` wins.

2. **`claude.md`** (this file) — Development conventions,
   tooling config, coding standards, and implementation notes
   that do NOT override product requirements.

Always read `requirements_v2.md` before implementing any
feature, endpoint, data model, or UI component.

# Lux Engine (Hybrid IDX Edition) — Product Requirement Document

## 1. Executive Summary

Lux Engine (formerly AZLuxTour) is an automated **Luxury Marketing Engine** for real estate agents.

**The Core Value:** Lux Engine provides both the data pipe and the presentation layer. Agents do not need their own IDX subscription to use the platform. They simply enter their MLS Agent ID, and the system fetches their active listings via the Lux Engine Master License to generate high-end marketing assets instantly.

**The Hybrid Model:**

- **Default (Frictionless):** Uses Lux Engine Master IDX Feed. Agent enters ID → Sites are built.
- **Pro (BYOK):** Option for users to input their own IDX Broker API Key if they already have one and want specific brokerage-level configurations.

**The Build:** AI-First development (Cursor/Claude) using Next.js.

**The Price:** $1,200/year — justified by "All-inclusive" value: Hosting, Data Feed, AI Marketing, Video Generation.

---

## 2. Problem Statement & Opportunity

### The Problem

- **The "Tech Tax":** For an agent to have a website that auto-updates, they typically pay for an IDX feed ($60–$100/mo) + a Website Builder ($50/mo) + Hosting ($20/mo).
- **Setup Fatigue:** Configuring an IDX feed requires API keys, brokerage approval, and waiting periods. High-producing agents don't have time for this.
- **Generic Output:** Even after setup, standard IDX feeds produce ugly, spreadsheet-like grids that devalue luxury properties.

### The Opportunity

Lux Engine acts as a **"Marketing Concierge."** By bundling the Master IDX License, an agent can go from "Sign Up" to "Live Luxury Site" in under 2 minutes, bypassing weeks of technical setup.

---

## 3. User Flow (The "Zero-Friction" Experience)

1. **Payment:** Agent purchases the $1,200/year subscription via Stripe.
2. **Onboarding (The Fork):**
   - **Option A (Most Users):** "I want to use Lux Engine Data." → Enter MLS Agent ID (e.g., `SA654321`) and MLS Name (e.g., `ARMLS`).
   - **Option B (Advanced):** "I have my own IDX Broker Key." → Paste API Key.
3. **The Fetch:**
   - System queries the IDX API (using either Master Key or User Key) filtering for that specific Agent ID.
4. **The Dashboard:** Agent sees their live inventory.
5. **One-Click Build:** Agent clicks "Launch Site" on a listing.
   - **AI:** GPT-4o rewrites the description.
   - **Media:** High-res photos are pulled and arranged in a luxury layout.
   - **Result:** `123Camelback.LuxEngine.io` (or custom domain) is live.

---

## 4. Feature Set

### 4.1 Core Features (MVP)

- **Universal Listing Search:** The backend uses the Master Key to search the entire MLS for listings matching the user's Agent ID.
- **"Is This You?" Verification:** To prevent typos, the system shows the first found listing and asks the agent to confirm ownership before importing the rest.
- **Data Normalization:** The system treats data identically whether it comes from the Master Feed or a User Key.
- **AI Listing Enhancer:**
  - _Input:_ Raw MLS text (e.g., "NEW CARPT, GRT SCHOOLS")
  - _Process:_ GPT-4o rewrites this into 3 distinct narratives: "The Romantic," "The Investor," and "The Family."
- **Compliance Auto-Footer (Critical):** Since IDX data is being displayed, the footer must automatically generate: _"Listing provided courtesy of [Brokerage Name] via [MLS Name]. Information deemed reliable but not guaranteed."_ This must happen automatically based on the data payload.

### 4.2 "100x" Features (Differentiation)

- **Live Price Sync:** If the price drops in the MLS on Friday, the Lux Engine site updates automatically by Saturday morning.
- **QR Code Flyer Generator:** Instantly generates a print-ready PDF flyer with a QR code pointing to the mobile-optimized site.
- **Lead Routing:** Leads generated on the site must be emailed/texted to the Subscriber (User), not the owner of the Master IDX account. The system must override the default contact routing.

---

## 5. Technical Stack (AI-Led Build)

**Frontend:** Next.js (App Router)
**Backend/Database:** Convex (real-time database, server functions, and background jobs)
**Auth:** Clerk (user authentication, session management, and onboarding flows)
**Data Provider:** IDX Broker Platinum API (Master Key)

### The "Hybrid Router" Architecture

The AI needs to build a robust fetcher that decides which key to use.

**Key API Endpoints to Implement:**

- **Search Endpoint:** `GET /clients/featured` (if BYOK) OR `GET /search/listings` (if Master Key)
  - Filter: `?agentID=[User_Input_ID]`
  - Filter: `?status=active`

### AI Prompt Strategy (for Cursor/Claude)

**Prompt 1 — The Logic:**

> "Create a Next.js server action called `fetchListings`. It should use Clerk to get the current user's session and look up their record in Convex. If the user has a `custom_api_key`, use that in the header. If not, use `process.env.MASTER_IDX_KEY`. Then, query the IDX Broker API for listings matching the user's `agent_id` and write the results back to Convex."

**Prompt 2 — Compliance:**

> "Create a React component called `IDXFooter`. It must accept the listing object as a prop. It must display the `listingOfficeName` and the IDX logo as required by real estate compliance rules. This component cannot be hidden via CSS."

**Prompt 3 — The Enhancer:**

> "Create a function that takes the `publicRemarks` string from the IDX object. Send it to OpenAI GPT-4o with a prompt to 'Rewrite this real estate description to be elegant, professional, and SEO optimized'. Store the result in Convex so we don't re-generate it on every page load."

---

## 6. UX/UI Strategy

- **The "Luxury Portal" Vibe:** The dashboard should not look like a SaaS tool. It should feel like an exclusive club. Dark mode default. See color palette below.
- **Zero-Config Dashboard:**
  - _State 1 (Empty):_ "Enter your Agent ID to unlock your inventory."
  - _State 2 (Populated):_ Grid of listings with high-res hero images.
- **Editor Mode:** When editing a site, the interface is WYSIWYG. The user clicks the text to edit the AI's suggestions if needed.

### Color Palette

| Role               | Name            | Hex       | Usage                                                                           |
| ------------------ | --------------- | --------- | ------------------------------------------------------------------------------- |
| **Primary Base**   | Obsidian Black  | `#1A1A1A` | Provides the "heavy," grounded feel of a luxury watch face.                     |
| **Secondary Base** | Gunmetal Grey   | `#54585A` | Adds dimension and prevents the design from looking flat or void-like.          |
| **Accent A**       | Electric Sulfur | `#F2FF00` | High-contrast, modern, and aggressive. Use for thin borders or icons.           |
| **Accent B**       | Burnt Cinnabar  | `#D35400` | A deeper, "heritage" orange that feels like premium leather or instrumentation. |

---

## 7. Success Metrics (KPIs)

| Metric              | Description                                                                     | Target                                       |
| ------------------- | ------------------------------------------------------------------------------- | -------------------------------------------- |
| **Match Rate**      | % of users who enter their Agent ID and successfully find their active listings | >95%                                         |
| **Utilization**     | How many listings does the average user activate?                               | 100% of active inventory                     |
| **Support Tickets** | Volume of "I can't find my listing" tickets                                     | Low (if high, API search logic needs tuning) |

---

## 8. Go-to-Market Strategy

- **The "Free Data" Hook:** "Stop paying for a clunky IDX feed just to display your own listings. Lux Engine includes the data connection for free."
- **Brokerage Whitelabel:** Approach boutique luxury brokerages (e.g., 20 agents). Offer: "We will power all your Single Property Websites. We handle the data connection. You just give us the list of Agent IDs."
- **Direct Outreach (Arizona Focus):** Scrape the "Hot Sheet" (new listings >$1M) in Arizona. Email the agent: "I see you just listed 123 Camelback Dr. I've already generated a dedicated luxury site for it using MLS data. Want the link? It's ready now."

---

## 9. Compliance Notes (Crucial for Tech Team)

- **Attribution:** When using a Master Feed to display listings that belong to the logged-in user, you are generally compliant (displaying one's own listings).
- **Safety Check:** Ensure the `fetchListings` logic strictly filters by `AgentID`. User A must not be able to accidentally generate a marketing site for User B's listing without permission (unless the Master License allows full IDX display, in which case attribution rules apply).
