import { test, expect, Page } from "@playwright/test";

test("health endpoint reports the web service status", async ({ request }) => {
  const response = await request.get("/api/health");
  expect(response.ok()).toBeTruthy();
  await expect(response.json()).resolves.toEqual({
    status: "healthy",
    service: "lux-engine-web",
  });
  expect(response.headers()["cache-control"]).toContain("no-store");
});

async function safeGoto(
  page: Page,
  path: string,
  options?: { timeout?: number },
) {
  const timeout = options?.timeout ?? 30000;
  const maxAttempts = 3;
  for (let i = 0; i < maxAttempts; i++) {
    try {
      await page.goto(path, { timeout });
      return;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (i < maxAttempts - 1 && msg.includes("ERR_NAME_NOT_RESOLVED")) {
        await page.waitForTimeout(2000);
        continue;
      }
      throw err;
    }
  }
}

test.describe("Landing Page (unauthenticated)", () => {
  test("renders hero section", async ({ page }) => {
    test.setTimeout(60000);
    await safeGoto(page, "/", { timeout: 45000 });
    await expect(page.locator("text=Your Listings.")).toBeVisible({
      timeout: 15000,
    });
    await expect(page.locator("text=Elevated.")).toBeVisible();
    await expect(
      page.locator("text=Real Estate Marketing Platform"),
    ).toBeVisible();
  });

  test("shows sign-in button in header", async ({ page }) => {
    await safeGoto(page, "/");
    await expect(
      page.getByRole("button", { name: "Sign In" }).first(),
    ).toBeVisible();
  });

  test("shows three feature cards", async ({ page }) => {
    await safeGoto(page, "/");
    await expect(page.locator("text=IDX Data Included")).toBeVisible();
    await expect(page.locator("text=AI Copy — 3 Styles")).toBeVisible();
    await expect(page.locator("text=Live in < 2 Min")).toBeVisible();
  });

  test("sign-in modal opens on button click", async ({ page }) => {
    await safeGoto(page, "/");
    await page.getByRole("button", { name: "Sign In" }).first().click();
    await expect(page.getByRole("heading", { name: /Sign in/i })).toBeVisible({
      timeout: 15000,
    });
    await expect(
      page.getByRole("textbox", { name: "Email address" }),
    ).toBeVisible({ timeout: 10000 });
  });

  test("sign-up modal accessible from sign-in", async ({ page }) => {
    test.setTimeout(60000);
    await safeGoto(page, "/");
    await page.getByRole("button", { name: "Sign In" }).first().click();
    await expect(page.getByRole("heading", { name: /Sign in/i })).toBeVisible({
      timeout: 20000,
    });
    await page.getByRole("link", { name: "Sign up" }).click({ timeout: 10000 });
    await expect(
      page.getByRole("heading", { name: /Create your account/i }),
    ).toBeVisible({ timeout: 10000 });
  });

  test("CTA button is present", async ({ page }) => {
    await safeGoto(page, "/");
    await expect(
      page.getByRole("button", { name: /Get Started/i }),
    ).toBeVisible();
  });
});

test.describe("Clerk Auth Flow", () => {
  test("sign-up form has the required account fields", async ({ page }) => {
    await safeGoto(page, "/");
    await page.getByRole("button", { name: "Sign In" }).first().click();
    await page.getByRole("link", { name: "Sign up" }).click();
    await expect(
      page.getByRole("textbox", { name: "Email address" }),
    ).toBeVisible();
    await expect(page.getByRole("textbox", { name: "Password" })).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Continue", exact: true }),
    ).toBeVisible();
  });

  test("sign-in form rejects empty submit", async ({ page }) => {
    await safeGoto(page, "/");
    await page.getByRole("button", { name: "Sign In" }).first().click();
    await page.getByRole("button", { name: "Continue", exact: true }).click();
    await expect(page.getByRole("heading", { name: /Sign in/i })).toBeVisible({
      timeout: 5000,
    });
    await expect(
      page.getByRole("textbox", { name: "Email address" }),
    ).toBeVisible();
  });

  test("Google OAuth button present in sign-in", async ({ page }) => {
    await safeGoto(page, "/");
    await page.getByRole("button", { name: "Sign In" }).first().click();
    await expect(
      page.getByRole("button", { name: /Continue with Google/i }),
    ).toBeVisible({ timeout: 15000 });
  });
});

test.describe("Navigation & Layout", () => {
  test("page has correct title", async ({ page }) => {
    await safeGoto(page, "/");
    await expect(page).toHaveTitle(/Lux Engine/);
  });

  test("header shows Lux Engine branding", async ({ page }) => {
    await safeGoto(page, "/");
    await expect(page.locator("text=Lux Engine").first()).toBeVisible();
    await expect(page.locator("text=Luxury Marketing")).toBeVisible();
  });

  test("dark theme applied", async ({ page }) => {
    await safeGoto(page, "/");
    const bg = await page
      .locator("body")
      .evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(bg).toMatch(/rgb\(\s*2[0-6]\s*,\s*2[0-6]\s*,\s*2[0-6]\s*\)/);
  });
});

test.describe("Settings Page", () => {
  test("requires authentication", async ({ page }) => {
    await safeGoto(page, "/settings");
    await expect(page.locator("text=Authentication Required")).toBeVisible({
      timeout: 15000,
    });
    await expect(page.getByRole("button", { name: "Sign In" })).toBeVisible();
  });

  test("has dark background", async ({ page }) => {
    await safeGoto(page, "/settings");
    const bg = await page
      .locator("body")
      .evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(bg).toMatch(/rgb\(\s*2[0-6]\s*,\s*2[0-6]\s*,\s*2[0-6]\s*\)/);
  });

  test("has back navigation to dashboard", async ({ page }) => {
    await safeGoto(page, "/settings");
    await expect(page.locator("text=Lux Engine").first()).toBeVisible({
      timeout: 10000,
    });
  });
});

test.describe("Property Site — Not Found", () => {
  test("shows site unavailable for invalid subdomain", async ({ page }) => {
    await safeGoto(page, "/sites/nonexistent-test-site-xyz");
    await expect(page.locator("text=Site Unavailable")).toBeVisible({
      timeout: 15000,
    });
    await expect(
      page.locator("text=This listing is no longer active"),
    ).toBeVisible();
  });

  test("has link back to home", async ({ page }) => {
    await safeGoto(page, "/sites/nonexistent-test-site-xyz");
    await expect(
      page.getByRole("link", { name: /Lux Engine Home/i }),
    ).toBeVisible({ timeout: 15000 });
  });
});

test.describe("Admin Page", () => {
  test("requires authentication", async ({ page }) => {
    await safeGoto(page, "/admin");
    await expect(page.locator("text=Authentication required")).toBeVisible({
      timeout: 15000,
    });
    await expect(page.getByRole("button", { name: "Sign In" })).toBeVisible();
  });

  test("has dark background", async ({ page }) => {
    await safeGoto(page, "/admin");
    const bg = await page
      .locator("body")
      .evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(bg).toMatch(/rgb\(\s*2[0-6]\s*,\s*2[0-6]\s*,\s*2[0-6]\s*\)/);
  });

  test("shows Superadmin branding", async ({ page }) => {
    await safeGoto(page, "/admin");
    await expect(page.locator("text=Superadmin")).toBeVisible({
      timeout: 10000,
    });
  });
});
