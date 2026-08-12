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

  test("existing users synchronize email claims and superadmins are labeled", () => {
    const users = source("convex/users.ts");
    const admin = source("convex/admin.ts");

    expect(users).toContain("existing.email !== email");
    expect(users).toContain("await ctx.db.patch(existing._id, { email })");
    expect(admin).toContain(
      "user.email && superadminEmails().has(user.email.toLowerCase())",
    );
    expect(admin).toContain('? "superadmin"');
  });
});

test("Docker installs only after every required package input is copied", () => {
  const dockerfile = source("../Dockerfile");
  const installPosition = dockerfile.indexOf(
    "uv sync --frozen --no-dev --no-editable",
  );

  expect(installPosition).toBeGreaterThan(dockerfile.indexOf(".env.example"));
  expect(installPosition).toBeGreaterThan(dockerfile.indexOf("COPY providers"));
  expect(dockerfile).toContain("COPY pyproject.toml uv.lock");
  expect(dockerfile).not.toContain("pip install");
});

test("Hostinger containers stay behind the TLS reverse proxy", () => {
  const compose = source("../deploy/compose.yml");
  const networkOverride = source("../deploy/compose.proxy-network.yml");
  const nginx = source("../deploy/nginx-luxengine.conf");
  const guide = source("../deploy/hostinger-kvm2.md");

  expect(compose).toContain('"127.0.0.1:3000:3000"');
  expect(compose).toContain('"127.0.0.1:8082:8082"');
  expect(compose).toContain("no-new-privileges:true");
  expect(compose).toContain("cap_drop:");
  expect(networkOverride).toContain("${PROXY_NETWORK:?");
  expect(networkOverride).toContain("luxengine-web");
  expect(networkOverride).toContain("luxengine-proxy");
  expect(networkOverride).toContain("traefik.http.routers.luxengine-web.rule");
  expect(networkOverride).toContain(
    "traefik.http.routers.luxengine-proxy.rule",
  );
  expect(nginx).toContain("server_name luxengine.io www.luxengine.io;");
  expect(nginx).toContain("server_name proxy.luxengine.io;");
  expect(nginx).toContain("proxy_pass http://127.0.0.1:3000;");
  expect(nginx).toContain("proxy_pass http://127.0.0.1:8082;");
  expect(guide).toContain(
    "Do not combine the n8n and LuxEngine Compose files.",
  );
  expect(guide).toContain("This guide does not assume or install Caddy.");
  expect(guide).toContain(
    "Do not attach LuxEngine to an application project's default network",
  );
  expect(guide).toContain("PROXY_NETWORK=luxengine-edge");
  expect(guide).toContain("TRAEFIK_CERTRESOLVER=mytlschallenge");
  expect(guide).toContain("traefik.docker.network=root_default");
  expect(guide).toContain("do not add public rules for 3000 or 8082");

  const updater = source("../deploy/update-hostinger.sh");
  expect(updater).toContain("docker compose");
  expect(updater).toContain("COMPOSE_PARALLEL_LIMIT=1");
  expect(updater).not.toContain("systemctl restart");
});

test("production images use non-root users and exclude local secrets", () => {
  const proxyDockerfile = source("../Dockerfile");
  const proxyDockerignore = source("../.dockerignore");
  const webDockerfile = source("Dockerfile");
  const webDockerignore = source(".dockerignore");
  const nextConfig = source("next.config.ts");

  expect(proxyDockerfile).toContain(
    "apt-get install -y --no-install-recommends claude-code",
  );
  expect(proxyDockerfile).toContain("--uid 10001");
  expect(proxyDockerfile).toContain("USER luxengine");
  expect(webDockerfile).toContain("FROM node:22-alpine AS runner");
  expect(webDockerfile).toContain("USER luxengine");
  expect(webDockerfile).not.toContain("ARG CLERK_SECRET_KEY");
  expect(nextConfig).toContain('output: "standalone"');
  expect(proxyDockerignore).toContain(".env.*");
  expect(webDockerignore).toContain(".env.*");
});
