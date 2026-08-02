# Lux Engine — Product Specification & SOP v4.0

> **AUTHORITY:** This document is the v4.0 authoritative product specification for Lux Engine. All Claude Code, Manus, and N8N implementations must reference this document. When this file conflicts with `claude.md`, **this file wins**.
>
> **Last Updated:** March 2026 · **Classification:** CONFIDENTIAL — Internal Development Document
>
> © 2026 Lux Engine — Luxury Marketing Engine. All Rights Reserved.

---

## Table of Contents

1. [Product Overview & Platform Architecture](#1-product-overview--platform-architecture)
2. [User Roles, Accounts & Permissions](#2-user-roles-accounts--permissions)
3. [Multi-Tenancy & Tour ID System](#3-multi-tenancy--tour-id-system)
4. [Data Models & Field Specifications](#4-data-models--field-specifications)
5. [IDX Broker Integration](#5-idx-broker-integration)
6. [Admin UI — Tour Setup & Management](#6-admin-ui--tour-setup--management)
7. [Participant UI — Registration & Feedback](#7-participant-ui--registration--feedback)
8. [Best Home on Tour — Scoring & Award Logic](#8-best-home-on-tour--scoring--award-logic)
9. [Sponsor & Advertiser Display System](#9-sponsor--advertiser-display-system)
10. [Monetization & Licensing Model](#10-monetization--licensing-model)
11. [Post-Tour Automation & Reporting (N8N)](#11-post-tour-automation--reporting-n8n)
12. [App Screen & UX Requirements](#12-app-screen--ux-requirements)
13. [Edge Cases & Business Rules](#13-edge-cases--business-rules)
14. [Glossary](#14-glossary)

---

## 1. Product Overview & Platform Architecture

**What Lux Engine is, who it serves, and how it is structured.**

Lux Engine (Luxury Marketing Engine) is a multi-tenant, web-based platform that replaces paper feedback forms at title company-organized real estate caravan tour events. Multiple title companies (tenants) run independent tours simultaneously across different geographic markets on the same platform. Participants register once with a persistent account and join specific tours via a unique Tour Code. All feedback is anonymous. The platform monetizes through organizer licensing fees and national advertising inventory.

### 1.1 Platform Configuration Reference

| Parameter | Value |
|---|---|
| **App Name** | Lux Engine (Luxury Marketing Engine) |
| **Platform** | Mobile-responsive web app (React SPA or equivalent) |
| **Brand Colors** | Obsidian `#1A1A1A` · Gunmetal `#54585A` · Sulfur `#F2FF00` · Cinnabar `#D35400` |
| **Multi-Tenancy** | Each organizer is an isolated tenant; data never crosses tenants |
| **Auth** | Organizer: email+password · Participant: one-time registration + Tour Code |
| **Feedback** | Registered participants; submissions stored with NO `participant_id` (anonymous) |
| **IDX** | IDX Broker API — property data auto-populated on address entry |
| **Maps** | Google Maps Directions API — auto-routed caravan map by stop order |
| **Automation** | N8N handles all post-tour triggers, email, PDF generation, archiving |
| **Ads** | National banners (owner-controlled only) fixed at bottom of all pages |
| **Sponsors** | Per-tour sponsor cards managed by organizer; visible to participants |
| **Monetization** | Subscription licensing (monthly/annual) + per-tour + free trial tiers |

---

## 2. User Roles, Accounts & Permissions

### 2.1 Platform Owner (Super Admin)

- Full access to all tenants, all tours, all data.
- Manages national advertiser banners — upload, schedule, set display weight.
- Creates and manages organizer accounts and assigns licensing tiers.
- Views platform-wide analytics: tours run, participants, revenue, ad impressions.
- **Only role** that can create, edit, or remove national ad inventory.

### 2.2 Organizer (Title Company Admin)

- Scoped to their own tenant only — cannot see other organizers' data.
- Creates and manages tours: `DRAFT → ACTIVE → CLOSED → ARCHIVED`.
- Adds properties via address lookup using IDX Broker auto-fill.
- Drag-and-drop reorders stops; adds/removes properties up to and including day of tour.
- Assigns listing agent name and email to each property for PDF report delivery.
- Adds sponsors to a tour: logo, rep name, phone, website URL.
- Views live feedback leaderboard during the tour.
- Announces Best Home on Tour winner at the event using in-app Announce button.
- Closes tour to trigger all N8N post-tour automations.

### 2.3 Tour Participant (Agent / Sponsor / Vendor)

- One-time registration: name, email, password, role type (`Agent` / `Sponsor` / `Vendor`).
- Joins specific tours by entering a Tour Code or scanning a QR code.
- Submits feedback per property — feedback stored anonymously (no `participant_id` on record).
- Uploads up to 5 photos per property, each with a paired text note.
- Cannot submit twice for the same property (dual-layer soft block).
- Views sponsor cards and national advertiser banners throughout the app.

### 2.4 Listing Agent (Report Recipient Only)

- **NOT an app user.** Receives automated PDF report by email after tour closes.
- No login, no dashboard, no account required.
- Name and email entered by the organizer during tour setup.

### 2.5 National Advertiser

- Not an interactive app user.
- Banner creative managed exclusively by Platform Owner.
- Fixed mobile-style banner at bottom of every page, always visible.
- Cannot be hidden, disabled, or overridden by organizers.

---

## 3. Multi-Tenancy & Tour ID System

**How simultaneous tours from different organizers stay isolated.**

Lux Engine supports many organizers running tours simultaneously across different markets. Each organizer is a separate tenant with fully isolated data. The Tour Code is the key mechanism by which participants join the correct tour.

### 3.1 Tenant Isolation Model

```
Every DB record is scoped to org_id (tenant identifier).
Participant accounts exist at the platform level (cross-tenant).
Tour membership is scoped to specific tour_id.
Feedback submissions store tour_id + property_id — NO participant_id.
Organizer admin can ONLY query records where org_id = their own.
Platform Owner queries across all org_ids.
```

### 3.2 Tour Code Specification

| Field Name | Type | Values / Notes | Req |
|---|---|---|---|
| `tour_id` | UUID | Internal system identifier. Not shown to participants. | Yes |
| `tour_code` | String | Short public-facing code, e.g. `EVLUX03` or `AZTOUR24`. 4–8 uppercase alphanumeric characters. Auto-generated by system OR custom-entered by organizer. Must be **GLOBALLY UNIQUE** across all tenants. | Yes |
| `org_id` | UUID | Foreign key → Organizer/Tenant record. | Yes |

### 3.3 Participant Tour-Join Flow

| Step | Actor | Action |
|---|---|---|
| 1 | Participant | **First-Time: Scan QR Code or Visit URL** — New user scans QR code displayed by organizer OR visits app URL directly. Landing page shows Register and Log In. National ad banner at bottom. |
| 2 | Participant | **Registration Form** — Full Name, Email, Password, Confirm Password, Role (Agent/Sponsor/Vendor). Email verification link sent on submit. Account inactive until verified. |
| 3 | Participant | **Enter Tour Code** — After login, prompt: "Enter your Tour Code." Types e.g. `EVLUX03`. System validates: tour exists, status = `ACTIVE`. |
| 4 | System | **Grant Tour Access** — `tour_membership` record created (`participant_id` + `tour_id`). Participant sees the tour property list. |
| 5 | Participant | **Returning User (Future Tours)** — Logs in with email + password. Enters new Tour Code to join the next event. No re-registration ever needed. |

> **Anonymity Design:** `tour_membership` records who attended. Feedback submissions store NO `participant_id`. This two-layer design guarantees anonymity: we know who attended but cannot link any specific feedback record to any specific person.

---

## 4. Data Models & Field Specifications

**Complete schema for all database objects.**

### 4.1 Organizer (Tenant)

| Field Name | Type | Values / Notes | Req |
|---|---|---|---|
| `org_id` | UUID | Auto-generated tenant identifier | Yes |
| `org_name` | String | Title company / organizer business name | Yes |
| `org_email` | String | Primary contact email | Yes |
| `subscription_tier` | Enum | `FREE_TRIAL` · `MONTHLY` · `ANNUAL` · `PER_TOUR` | Yes |
| `subscription_status` | Enum | `ACTIVE` · `PAST_DUE` · `CANCELLED` · `TRIAL` | Yes |
| `billing_email` | String | Email for invoices/receipts | Yes |
| `theme_preference` | String | Reserved for future Theme Picker. Default: `'default'` | No |
| `created_at` | DateTime | Auto-set on creation | Yes |

### 4.2 Tour Event

| Field Name | Type | Values / Notes | Req |
|---|---|---|---|
| `tour_id` | UUID | Auto-generated internal ID | Yes |
| `tour_code` | String | Short public Tour Code. Globally unique. | Yes |
| `org_id` | UUID | Foreign key → Organizer | Yes |
| `tour_name` | String | Display name, e.g. "East Valley Luxury Tour" | Yes |
| `tour_date` | Date | ISO 8601: `YYYY-MM-DD` | Yes |
| `tour_status` | Enum | `DRAFT` · `ACTIVE` · `CLOSED` · `ARCHIVED` | Yes |
| `organizer_email` | String | Notification email for post-tour reports | Yes |
| `property_ids` | Array | Ordered array of `property_id` refs | Yes |
| `sponsor_ids` | Array | Array of `sponsor_id` refs for this tour | No |
| `archive_after_days` | Integer | Default: 90 | No |
| `closed_at` | DateTime | Auto-set when status → `CLOSED` | No |
| `created_at` | DateTime | Auto-set on creation | Yes |

### 4.3 Property

| Field Name | Type | Values / Notes | Req |
|---|---|---|---|
| `property_id` | UUID | Auto-generated | Yes |
| `tour_id` | UUID | Foreign key → Tour | Yes |
| `org_id` | UUID | Denormalized tenant scope | Yes |
| `address` | String | Full street address, city, state, ZIP | Yes |
| `photo_url` | String | Main listing photo (IDX or manual upload) | Yes |
| `listing_price` | Integer | USD. IDX-populated or manual. | Yes |
| `mls_link` | String | URL to MLS/realtor.com listing | No |
| `listing_agent_name` | String | Organizer-entered. Shown to participants. | Yes |
| `listing_agent_email` | String | For PDF report delivery. **NOT shown to participants.** | Yes |
| `stop_order` | Integer | Visit sequence: 1 = first stop | Yes |
| `idx_synced` | Boolean | True if auto-populated via IDX Broker | Yes |
| `is_best_home_winner` | Boolean | Default `False`. True when winner announced. | Yes |
| `winner_announced_at` | DateTime | Timestamp when admin taps Announce Winner | No |

### 4.4 Feedback Submission (Anonymous)

> **No `participant_id` stored.** One record per device-session per property. Enum ratings map to integers: `Poor=1, Decent=2, Average=3, Good=4, Excellent=5`.

| Field Name | Type | Values / Notes | Req |
|---|---|---|---|
| `feedback_id` | UUID | Auto-generated | Yes |
| `property_id` | UUID | FK → Property | Yes |
| `tour_id` | UUID | FK → Tour | Yes |
| `org_id` | UUID | FK → Organizer (denormalized) | Yes |
| `submitted_at` | DateTime | Auto-set | Yes |
| `cleanliness` | Enum | `Poor` · `Decent` · `Average` · `Good` · `Excellent` | Yes |
| `curb_appeal` | Enum | `Poor` · `Decent` · `Average` · `Good` · `Excellent` | Yes |
| `landscaping` | Enum | `Poor` · `Decent` · `Average` · `Good` · `Excellent` | Yes |
| `flooring` | Enum | `Poor` · `Decent` · `Average` · `Good` · `Excellent` | Yes |
| `paint` | Enum | `Poor` · `Decent` · `Average` · `Good` · `Excellent` | Yes |
| `showability` | Enum | `Poor` · `Decent` · `Average` · `Good` · `Excellent` | Yes |
| `overall_impression` | Integer | 1–10 scale | Yes |
| `suggested_price` | Integer | Participant's suggested price in USD | Yes |
| `best_home_vote` | Boolean | True = voted this property as Best Home on Tour | Yes |
| `photo_urls` | Array | Up to 5 uploaded image URLs | No |
| `photo_notes` | Array | Parallel text notes per photo. Max 500 chars each. | No |
| `comments` | Text | Open-ended feedback. Max 1000 characters. | No |
| `session_token` | String | Hashed browser session token for duplicate guard. NOT linkable to participant identity. | Yes |

### 4.5 Participant Account

| Field Name | Type | Values / Notes | Req |
|---|---|---|---|
| `participant_id` | UUID | Auto-generated | Yes |
| `full_name` | String | Full name | Yes |
| `email` | String | Unique. Used for login. | Yes |
| `role_type` | Enum | `AGENT` · `SPONSOR` · `VENDOR` | Yes |
| `password_hash` | String | Bcrypt or equivalent | Yes |
| `email_verified` | Boolean | Must be `True` before joining a tour | Yes |
| `created_at` | DateTime | Auto-set | Yes |

### 4.6 Tour Membership

| Field Name | Type | Values / Notes | Req |
|---|---|---|---|
| `membership_id` | UUID | Auto-generated | Yes |
| `participant_id` | UUID | FK → Participant Account | Yes |
| `tour_id` | UUID | FK → Tour Event | Yes |
| `joined_at` | DateTime | Timestamp when Tour Code was entered | Yes |

### 4.7 Sponsor

| Field Name | Type | Values / Notes | Req |
|---|---|---|---|
| `sponsor_id` | UUID | Auto-generated | Yes |
| `tour_id` | UUID | FK → Tour (sponsors are per-tour) | Yes |
| `org_id` | UUID | FK → Organizer | Yes |
| `company_name` | String | Sponsor company name | Yes |
| `rep_name` | String | Name of attending representative | Yes |
| `rep_phone` | String | Direct phone displayed on sponsor card | Yes |
| `logo_url` | String | Uploaded logo image URL | Yes |
| `website_url` | String | Destination URL when logo is tapped | Yes |
| `display_order` | Integer | Order in sponsor grid/carousel | No |

### 4.8 National Ad (Platform Owner Only)

| Field Name | Type | Values / Notes | Req |
|---|---|---|---|
| `ad_id` | UUID | Auto-generated | Yes |
| `advertiser_name` | String | Internal label for reporting | Yes |
| `banner_url` | String | Image URL. Mobile banner ratio (e.g. 320×50px) | Yes |
| `click_url` | String | Destination URL on tap | Yes |
| `is_active` | Boolean | Only active ads display | Yes |
| `display_weight` | Integer | Rotation weight vs other active ads | No |
| `created_at` | DateTime | Auto-set | Yes |

---

## 5. IDX Broker Integration

**Auto-populating property data from MLS when organizer enters an address.**

When the organizer types a property address, the app queries IDX Broker to retrieve listing data automatically. Organizer can override any field. If address not found, manual entry mode activates.

### 5.1 IDX Lookup Flow

| Step | Actor | Action |
|---|---|---|
| 1 | Organizer | **Types address into Add Property field.** Autocomplete queries IDX Broker property search endpoint. Matching listings appear as dropdown suggestions. |
| 2 | IDX API | **Returns listing data on selection.** Fields mapped: photo → `photo_url`, price → `listing_price`, address → `address`, MLS URL → `mls_link`. `idx_synced = True`. |
| 3 | Organizer | **Reviews and edits auto-populated fields.** All IDX fields pre-filled but editable. Organizer must manually enter: `listing_agent_name`, `listing_agent_email`, `stop_order`. |
| 4 | Organizer | **Saves property to tour.** Property record created and appears on the tour property list. |

### 5.2 IDX Field Mapping

| IDX Broker Field | App Field |
|---|---|
| `listingPhoto` (primary) | `photo_url` |
| `listPrice` | `listing_price` |
| `fullAddress` | `address` |
| `detailsURL` | `mls_link` |

### 5.3 Configuration

```
ENV VARS REQUIRED: IDX_BROKER_API_KEY
FALLBACK: If address not found in IDX, show manual entry mode. idx_synced = False.
```

---

## 6. Admin UI — Tour Setup & Management

**Every screen and interaction available to the organizer.**

### 6.1 Tour List Dashboard

- All tours listed sorted by `tour_date` descending.
- Status badges styled in Lux Engine brand: `DRAFT` (gunmetal) · `ACTIVE` (sulfur) · `CLOSED` (cinnabar) · `ARCHIVED` (muted gray).
- Per-row: Tour Name, Tour Code, Date, Property Count, Submission Count.
- Row actions: Edit (DRAFT only) · View · Archive · Delete (DRAFT only).
- "+ Create New Tour" button top-right in sulfur.

### 6.2 Create / Edit Tour

- Fields: Tour Name, Tour Date, Tour Code (auto-generated, editable), Organizer Email.
- Tour Code field: auto-generated, with "Regenerate" and "Copy" icon buttons.
- QR Code auto-generated from Tour Code — downloadable as PNG for printing/displaying.
- Buttons: Save as Draft · Publish (set `ACTIVE`).

### 6.3 Property Management (Drag-and-Drop)

- **Add Property:** Address autocomplete → IDX lookup → fields auto-fill. Organizer adds `listing_agent_name` + `listing_agent_email`, confirms.
- **Drag-and-Drop Reorder:** Properties shown as draggable cards. `stop_order` updates on drop. Google Map route updates in real time.
- **Edit Property:** All fields editable at any time including during `ACTIVE` tour.
- **Remove Property:** Available until tour is `CLOSED`. Confirmation modal warns that submitted feedback will be permanently deleted.
- **Day-of Changes:** No restriction. Full add/remove/reorder right up to Close Tour.

### 6.4 Google Maps Route Panel

- Embedded Google Map alongside the property list in admin.
- Driving route auto-drawn connecting properties in current `stop_order`.
- Route updates live on every drag-drop or add/remove action.
- Numbered map pins match `stop_order` (Pin 1 = Stop 1, etc.).
- Participant-facing tour page shows same map in read-only mode.

### 6.5 Sponsor Management

- Sponsors tab within each tour record.
- Add Sponsor: upload logo, Company Name, Rep Name, Rep Phone, Website URL, Display Order.
- Sponsors appear: Sponsors tab (all participants), rotating bottom banner on property pages, post-tour recap email footer, login/registration page banner.
- Sponsors are tour-scoped: Tour A sponsors never appear in Tour B.

### 6.6 Live Leaderboard & Close Tour

- Leaderboard tab: properties ranked by `combined_rank_score`, auto-refreshes every 60s.
- Columns: Rank · Address · Avg Impression Score · Vote Count · Vote % · Combined Score.
- Winner row highlighted in sulfur (`#F2FF00`) when it reaches #1.
- **"Announce Winner" button:** marks winner in DB, freezes leaderboard display.
- **"Close Tour" button:** confirmation modal required. Sets status = `CLOSED`. Fires N8N webhook.
- **"Show QR Code" button:** full-screen QR for organizer to display to group.

> **FUTURE / NICE-TO-HAVE:** Theme Picker. The `theme_preference` field is reserved in the Organizer schema. In a future release, organizers select a color theme for their participant-facing experience. **Not required for initial build (v1).**

---

## 7. Participant UI — Registration & Feedback

**How agents, sponsors, and vendors use Lux Engine on tour day.**

### 7.1 Registration & Login Flow

| Step | Actor | Action |
|---|---|---|
| 1 | Participant | **Scan QR Code or Visit App URL** — Landing page: Lux Engine logo, Register and Log In buttons. Sponsor banners and national ad banner visible. |
| 2 | Participant | **Registration Form** — Full Name, Email, Password, Confirm Password, Role: Agent / Sponsor / Vendor. Submit → email verification sent. Account inactive until verified. |
| 3 | Participant | **Verify Email** — Clicks link in email. Account activated. Redirected to Tour Code entry. |
| 4 | Participant | **Enter Tour Code** — Large mobile-friendly code input. Validated against active tours. On match: tour property list loads. |
| 5 | Participant | **Returning User** — Login with email + password → Enter new Tour Code. No re-registration ever. |

### 7.2 Feedback Form Fields

One form per property per participant. All required fields must be complete before Submit is enabled. Mobile-optimized — large tap targets, no small dropdowns.

| Field Name | Type | Values / Notes | Req |
|---|---|---|---|
| Cleanliness | Tap-select | 5-button group: `Poor` · `Decent` · `Average` · `Good` · `Excellent` | Yes |
| Curb Appeal | Tap-select | 5-button group: `Poor` · `Decent` · `Average` · `Good` · `Excellent` | Yes |
| Landscaping | Tap-select | 5-button group: `Poor` · `Decent` · `Average` · `Good` · `Excellent` | Yes |
| Flooring | Tap-select | 5-button group: `Poor` · `Decent` · `Average` · `Good` · `Excellent` | Yes |
| Paint | Tap-select | 5-button group: `Poor` · `Decent` · `Average` · `Good` · `Excellent` | Yes |
| Showability | Tap-select | 5-button group: `Poor` · `Decent` · `Average` · `Good` · `Excellent` | Yes |
| Overall Impression | 1–10 row | Tap-to-select integer row. 1=lowest, 10=highest | Yes |
| Suggested Price | Currency | Numeric input. Formatted as `$XXX,XXX`. | Yes |
| Best Home Vote | Toggle | Large prominent toggle labeled "Vote this as Best Home on Tour" | Yes |
| Photos + Notes | Camera/file | Up to 5 photos. Each photo has paired note field (max 500 chars). Label: "What are you drawing attention to?" | No |
| Comments | Textarea | Open feedback. Max 1000 chars. Live character counter. | No |

### 7.3 Submission & Duplicate Prevention

| Step | Actor | Action |
|---|---|---|
| 1 | Participant | **Taps Submit** — Validation: all required fields present. Scroll to and highlight any missing field. |
| 2 | System | **Confirmation Modal** — "Submit feedback for [address]? You will not be able to edit after submitting." Cancel · Confirm Submission. |
| 3 | System | **Record Saved** — `feedback_submission` saved. `session_token` hashed and stored. `participant_id` is NOT stored on the record. |
| 4 | System | **Success Screen** — Full-screen success: large cinnabar/sulfur checkmark, "Feedback Submitted!", property address. "Back to Tour Properties" button. Cannot navigate back to form. |
| 5 | System | **Duplicate Blocked** — Same `session_token` OR same account for same property: "You have already submitted feedback for this property. Submissions are final." No edit option ever. |

> **Dual-layer duplicate prevention:** (1) `session_token` detects same-device resubmit. (2) `tour_membership` + property check detects same-account submit from different browser. Feedback is intentionally non-editable to maintain reporting integrity.

---

## 8. Best Home on Tour — Scoring & Award Logic

### 8.1 Scoring Algorithm

```
FOR EACH property in tour:

  avg_score = MEAN(overall_impression) across all submissions
  [Float 1.0–10.0, rounded to 2 decimal places]

  vote_count = COUNT(best_home_vote = True) for this property
  total_part = COUNT(tour_membership) for this tour
  vote_pct   = (vote_count / total_part) * 100

  combined_rank_score = (avg_score * 0.60) + (vote_pct * 0.40)

WINNER = property with highest combined_rank_score

TIE RULE: scores within 0.10 points → organizer resolves manually
```

### 8.2 Award Flow

| Step | Actor | Action |
|---|---|---|
| 1 | Organizer | **Monitors live leaderboard throughout tour.** Rankings update every 60s. Organizer watches scores evolve in real time. |
| 2 | Organizer | **Taps "Announce Winner" before group disperses.** Done at final property or on the bus before departure. |
| 3 | System | **Winner flagged in database.** `is_best_home_winner=True`, `winner_announced_at=now()`. Leaderboard freezes, winner row highlighted in sulfur (`#F2FF00`). |
| 4 | Organizer | **Physical award moment.** Best Home on Tour sign presented to listing agent. Group photo taken for social media. App optionally shows a Winner announcement screen as photo backdrop. |
| 5 | N8N | **Winner referenced in all post-tour emails.** Listing agent report, organizer recap, and sponsor recap all include winning address + score. |

---

## 9. Sponsor & Advertiser Display System

### 9.1 Sponsor Card Spec

Each sponsor card displays: logo image (tappable → `website_url`), representative name, and direct phone number. Cards appear in four locations:

| Location | Display Behavior |
|---|---|
| **Sponsors Tab** | Dedicated tab in participant nav. Grid of all tour sponsors. Logo tappable. Rep name + phone below logo. |
| **Login/Registration Page** | Horizontal scroll row of sponsor logos below the form. Only shows sponsors for the tour associated with the QR code origin, if determinable. |
| **Property Page Banner** | Rotating sponsor logos (one at a time, cycling every 5s) displayed just above the national ad banner at the bottom of every property page. |
| **Post-Tour Recap Email** | Sponsor logo grid in email footer of all post-tour emails. |

### 9.2 National Advertiser Banners

- **Placement:** Fixed at the absolute bottom of EVERY page — mobile banner style (320×50 or 360×60px). Stacking order bottom-up: `[National Ad]` → `[Rotating Sponsor Banner]` → page content.
- **Control:** Platform Owner (Super Admin) ONLY. Organizers cannot hide, remove, or replace.
- **Rotation:** Multiple active ads rotate by `display_weight`. Impression tracked per `ad_id`.
- **Click Tracking:** Each tap logs a click event against `ad_id` for revenue reporting.
- **Always On:** Present on registration, login, property list, property detail, feedback form, and success screens — **no exceptions**.

---

## 10. Monetization & Licensing Model

Lux Engine generates revenue through two streams: organizer licensing fees and national advertiser placements. All billing is handled externally (Stripe or similar); the app stores tier and status only and enforces access accordingly.

### 10.1 Licensing Tiers

| Tier | Billing | Tour Limit | Notes |
|---|---|---|---|
| `FREE_TRIAL` | No charge | 1 tour | All features. 30-day limit. |
| `PER_TOUR` | Per-event fee | Unlimited | Pay per tour. No subscription required. |
| `MONTHLY` | Monthly subscription | Unlimited | All features. Billed monthly. |
| `ANNUAL` | Annual subscription | Unlimited | All features. Best value, discounted rate. |

### 10.2 Access Enforcement

- **`PAST_DUE`:** Organizer can view existing tours but cannot create new ones. Admin banner: "Your subscription is past due. Update billing to create new tours."
- **`CANCELLED`:** Read-only access to archived data only.
- **`FREE_TRIAL` expired:** N8N scheduler auto-sets status = `CANCELLED` after 30 days. Email sent: "Your trial has ended. Upgrade to continue."
- **`PER_TOUR`:** Creating a new tour triggers a payment request before tour is created.
- **Mid-tour lapse:** An `ACTIVE` tour **ALWAYS** runs to completion. Subscription enforcement only applies to creating NEW tours. **Never interrupt a live event.**

### 10.3 Ad Revenue

- National advertisers managed directly by Platform Owner in v1 (no self-serve portal).
- Impressions and click-through rates tracked per `ad_id` in Platform Owner dashboard.
- Ad inventory fields reserved in schema for future self-serve advertiser portal (v2 roadmap).

---

## 11. Post-Tour Automation & Reporting (N8N)

**Every trigger, webhook, and automated action.**

### 11.1 Automation Triggers

| Trigger | Condition | Action | Tool |
|---|---|---|---|
| **Tour Closed** | `tour_status` → `CLOSED` | Fire `POST /webhook/tour-closed`. Begin full post-tour sequence. | N8N Webhook |
| **Generate PDFs** | tour-closed received | Per property: aggregate feedback, compute scores, generate branded PDF. | N8N + Python |
| **Email Listing Agent** | PDF ready per property | Send to `listing_agent_email`. Subject: "Your Feedback — [address]". Attach PDF. | N8N SMTP |
| **Email Org Recap** | All PDFs sent | Full tour summary to `organizer_email`: all scores, winner, attendance. | N8N SMTP |
| **Email Sponsor Recap** | All PDFs sent | Recap to sponsor rep emails: Best Home winner + tour stats + logo strip. | N8N SMTP |
| **PDF Bounce Retry** | Email fails | Retry ×2 at 30-min intervals. On 3rd fail: alert `organizer_email` with PDF attached. | N8N SMTP |
| **Trial Expiry** | 30 days post-creation (`FREE_TRIAL`) | Set `subscription_status = CANCELLED`. Email organizer. | N8N Scheduler |
| **Auto-Archive** | `archive_after_days` elapsed | Set `tour_status = ARCHIVED`. Remove from active admin view. | N8N Scheduler |

### 11.2 Webhook Endpoints (App Must Expose)

```
POST /webhook/tour-closed
Body: { tour_id, org_id, closed_at, organizer_email }

GET /api/tour/{tour_id}/summary
Returns: tour + all properties + aggregated scores + Best Home winner

GET /api/property/{property_id}/feedback
Returns: all submissions + computed averages

GET /api/tour/{tour_id}/leaderboard
Returns: all properties ranked by combined_rank_score
```

### 11.3 PDF Report Content (Per Property)

- **Header:** Lux Engine branding (brand colors), property address, tour date, organizer name.
- **Property Photo:** full width.
- **Submission Count:** "X participants submitted feedback".
- **Category Score Table:** Avg 1–5 score + visual bar for each of 6 categories.
- **Overall Impression:** Average score out of 10.
- **Suggested Price Analysis:** Median, min, and max of all suggested prices.
- **Best Home Votes:** Vote count + % of total participants.
- **Best Home Winner Banner** (winning property only, styled in sulfur/cinnabar).
- **Participant Photos + Notes:** All uploaded photos with notes, anonymous.
- **Open Comments:** All free-text comments verbatim, anonymous.
- **Sponsor Logo Strip:** All tour sponsors in report footer.
- **Footer:** Confidentiality note, tour date, organizer contact.

---

## 12. App Screen & UX Requirements

**All screens, navigation, and mobile design rules in Lux Engine brand.**

All screens use the Lux Engine brand palette: Obsidian (`#1A1A1A`) backgrounds, Gunmetal (`#54585A`) panels and secondary surfaces, Sulfur (`#F2FF00`) for primary CTAs and highlights, Cinnabar (`#D35400`) for secondary accents and numbered elements. Typography: clean sans-serif. All interactive elements sized for thumb-friendly mobile use.

### 12.1 Login / Registration

**Access: PUBLIC**

- Lux Engine logo centered at top on obsidian background.
- Sulfur-outlined input fields, cinnabar Register CTA button.
- Sponsor horizontal scroll row below form.
- National ad banner fixed at absolute bottom.

### 12.2 Tour Code Entry

**Access: AUTHENTICATED**

- Large centered input field with sulfur border, numeric/alpha keyboard auto-opens.
- Label: "Enter the Tour Code provided by your organizer".
- Error states: "Invalid Tour Code" · "Tour is not currently active" · "Tour not found".

### 12.3 Tour Property List

**Access: AUTHENTICATED**

- Tour name + date header bar in gunmetal.
- Property cards: thumbnail, stop number badge (cinnabar), address, SUBMITTED (sulfur checkmark) or NOT SUBMITTED (muted) badge.
- Read-only Google Map strip showing numbered pin route.
- Bottom nav: Tour · Sponsors · (national ad banner below nav).

### 12.4 Property Detail

**Access: AUTHENTICATED**

- Full-width hero photo, address, price (sulfur), tappable MLS link.
- Listing agent name shown. Email NOT shown to participants.
- "Stop X of Y" badge. Prev/Next navigation arrows.
- Sulfur "Submit Feedback" CTA (full-width) OR green "Feedback Submitted ✓" banner.
- National ad banner at bottom.

### 12.5 Feedback Form

**Access: AUTHENTICATED**

- Property address as sticky context header.
- Rating fields: obsidian buttons, sulfur selected state, full-width tap targets.
- Overall Impression: 1–10 row of large number tiles.
- Best Home Vote: prominent sulfur toggle.
- Photo grid: 5 upload slots with cinnabar "+" icons; note field below each.
- Comments textarea with live character counter.
- Submit: sulfur full-width button at bottom. Confirmation modal required.
- National ad banner visible but layout ensures it never covers Submit button.

### 12.6 Feedback Success

**Access: AUTHENTICATED**

- Full-screen obsidian with large sulfur/cinnabar animated checkmark.
- "Feedback Submitted!" in sulfur.
- Property address confirmation in white.
- "Back to Tour Properties" cinnabar button.
- Back navigation disabled from this screen.

### 12.7 Sponsors Tab

**Access: AUTHENTICATED**

- Grid of sponsor cards on gunmetal panel background.
- Each card: logo (tappable), rep name in white, phone in cinnabar.
- National ad banner at bottom.

### 12.8 Admin Tour Detail

**Access: ORGANIZER ONLY**

- Obsidian sidebar navigation: Properties · Sponsors · Leaderboard · Settings.
- Properties panel: draggable cards with sulfur drag handles.
- IDX address autocomplete bar at top of property list.
- Google Map panel (right side on desktop, below list on mobile).
- Close Tour (cinnabar) and Show QR Code (sulfur) buttons prominently placed.

---

## 13. Edge Cases & Business Rules

### Feedback submitted after tour CLOSED

Form disabled when `tour_status = CLOSED`. Submit button removed entirely. Message: "This tour has ended. Feedback is no longer being accepted."

### No feedback submitted for a property

PDF still generates. Show "No feedback submitted for this property." No division-by-zero in any score calculation.

### Participant votes Best Home on multiple properties

On second Best Home vote: "You already voted for [address]. Change your vote?" If confirmed, prior `best_home_vote = False`, new one = `True`.

### Tour Code collision across tenants

`tour_code` checked globally on creation. If conflict: "That code is already in use. Please choose another."

### Address not found in IDX Broker

Message: "Property not found in IDX. Enter details manually." Manual mode activates. `idx_synced = False`.

### Property removed after feedback submitted

Confirmation modal: "This will permanently delete X feedback submissions. This cannot be undone." Organizer must explicitly confirm.

### Listing agent email bounce

N8N retries ×2 at 30-minute intervals. After 3 failures: alert to `organizer_email` with PDF attached for manual forwarding.

### Best Home tie (within 0.10 points)

Both tied properties show "Tied" on leaderboard. Organizer uses Announce Winner on their chosen property to resolve.

### Same listing agent on multiple properties in one tour

Each property generates a separate PDF, separate emails to same address. Subject line differentiates by property address.

### Participant joins CLOSED or ARCHIVED tour

Tour Code entry: "This tour has ended and is no longer accepting participants." DRAFT: "This tour is not yet active. Check with your organizer."

### Subscription lapses mid-tour

**NEVER** interrupt a live active tour. Enforcement applies only to creating NEW tours. Active tours always complete regardless of billing status changes.

### Photo upload fails mid-submission

Inline error per photo: "Upload failed. Try again." Other form data preserved. Participant can retry that photo only.

---

## 14. Glossary

| Term | Definition |
|---|---|
| **Lux Engine** | The platform's brand name. Short for Luxury Marketing Engine. |
| **Tour Code** | Short alphanumeric public identifier (e.g. `EVLUX03`) used by participants to join a specific tour. Globally unique across all tenants. |
| **Tenant** | An organizer (title company) and all their associated data. Fully isolated from all other tenants on the platform. |
| **Tour Membership** | Record linking a participant account to a specific tour. Used for attendance tracking only. NOT linked to individual feedback submissions. |
| **Anonymous Feedback** | Feedback records with no `participant_id` field stored. We know who attended (`tour_membership`) but cannot link feedback to any individual. |
| **session_token** | Hashed browser identifier stored per submission to prevent duplicate submission from the same device. Not linked to personal identity. |
| **IDX Broker** | Third-party MLS data syndication service providing API access to property listings: photo, price, address, and MLS URL. |
| **stop_order** | Integer visit sequence for properties on a tour. 1 = first stop. |
| **combined_rank_score** | Weighted score for Best Home: `(avg_overall × 0.60) + (vote_pct × 0.40)`. |
| **Best Home on Tour** | Award for the property with the highest `combined_rank_score`. Announced live at the event by the organizer. |
| **Listing Agent** | Seller's real estate agent. Report recipient only. Not an app user. |
| **Sponsor** | Industry vendor featured in the app per-tour. Managed by organizer. |
| **National Advertiser** | Paying advertiser. Banner at bottom of all pages. Platform Owner only. |
| **Platform Owner** | Super-admin who owns and operates Lux Engine across all tenants. |
| **N8N** | Open-source workflow automation handling post-tour triggers and emails. |
| **subscription_tier** | `FREE_TRIAL` · `PER_TOUR` · `MONTHLY` · `ANNUAL` |
| **theme_preference** | Reserved field for future Theme Picker feature. Not in v1 build. |
| **Obsidian / Sulfur / Cinnabar / Gunmetal** | Lux Engine brand colors: `#1A1A1A` / `#F2FF00` / `#D35400` / `#54585A` |
