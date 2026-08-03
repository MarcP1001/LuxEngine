import { expect, test } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const projectRoot = path.resolve(__dirname, "..");

function source(relativePath: string): string {
  return fs.readFileSync(path.join(projectRoot, relativePath), "utf8");
}

test.describe("backend security contracts", () => {
  test("synchronization writes are internal and owner scoped", () => {
    const listings = source("convex/listings.ts");
    const schema = source("convex/schema.ts");

    expect(listings).toContain(
      "export const upsertSyncedListing = internalMutation",
    );
    expect(listings).not.toContain("export const insertListing = mutation");
    expect(listings).not.toContain("export const updateListing = mutation");
    expect(schema).toContain(
      '.index("by_owner_listing_id", ["clerkId", "listingId"])',
    );
  });

  test("site mutations enforce authenticated ownership", () => {
    const sites = source("convex/sites.ts");

    expect(sites).toContain('throw new Error("Not authenticated")');
    expect(sites).toContain("site.clerkId !== identity.subject");
    expect(sites).toContain('q.eq(q.field("status"), "live")');
    expect(sites).toContain("DOMAIN_RE.test(domain)");
    expect(sites).not.toContain("export const getSiteById = query");
  });

  test("AI writes use a current model and an internal mutation", () => {
    const ai = source("convex/ai.ts");

    expect(ai).toContain("ctx.auth.getUserIdentity()");
    expect(ai).toContain('"gemini-3.6-flash"');
    expect(ai).not.toContain("gemini-1.5-flash");
    expect(ai).toContain(
      "ctx.runMutation(internal.listings.updateAiDescriptions",
    );
  });

  test("public leads are bounded, validated, and HTML escaped", () => {
    const leads = source("convex/leads.ts");

    expect(leads).toContain("MAX_LEADS_PER_SITE_WINDOW");
    expect(leads).toContain('site.status !== "live"');
    expect(leads).toContain("EMAIL_RE.test(email)");
    expect(leads).toContain("escapeHtml(lead.message)");
    expect(leads).toContain("process.env.RESEND_FROM_EMAIL");
  });

  test("browser-facing profile queries do not return API keys", () => {
    const users = source("convex/users.ts");
    const brokerages = source("convex/brokerages.ts");

    expect(users).toContain("hasCustomApiKey: Boolean(customApiKey)");
    expect(brokerages).toContain("hasCustomApiKey: Boolean(customApiKey)");
    expect(brokerages).not.toContain("export const getBrokerageById = query");
    expect(brokerages).toContain("existingUser.brokerageId !== brokerage._id");
  });
});

test("Docker installs only after every required package input is copied", () => {
  const dockerfile = source("../Dockerfile");
  const installPosition = dockerfile.indexOf("pip install --no-cache-dir .");

  expect(installPosition).toBeGreaterThan(
    dockerfile.indexOf("COPY .env.example"),
  );
  expect(installPosition).toBeGreaterThan(dockerfile.indexOf("COPY providers"));
  expect(dockerfile).not.toContain("pip install --no-cache-dir -e .");
});

test("Hostinger services stay behind the TLS reverse proxy", () => {
  const webService = source("../deploy/lux-engine-web.service");
  const proxyService = source("../deploy/free-claude-code.service");
  const nginx = source("../deploy/nginx-luxengine.conf");
  const guide = source("../deploy/hostinger-kvm2.md");

  expect(webService).toContain("start --hostname 127.0.0.1 --port 3000");
  expect(proxyService).toContain("Environment=HOST=127.0.0.1");
  expect(nginx).toContain("server_name luxengine.io www.luxengine.io;");
  expect(nginx).toContain("server_name proxy.luxengine.io;");
  expect(nginx).toContain("proxy_pass http://127.0.0.1:3000;");
  expect(nginx).toContain("proxy_pass http://127.0.0.1:8082;");
  expect(guide).toContain("Do not add rules for 3000 or 8082.");

  const updater = source("../deploy/update-hostinger.sh");
  expect(updater).toContain("npm audit --omit=dev --audit-level=critical");
});
