import { expect, test } from "@playwright/test";
import axe from "axe-core";

const routes = [
  "/",
  "/demo",
  "/sites/demo",
  "/settings",
  "/brokerage",
  "/admin",
] as const;

for (const route of routes) {
  test(`${route} has no automated WCAG A/AA violations`, async ({ page }) => {
    await page.goto(route);
    await page.addScriptTag({ content: axe.source });

    const violations = await page.evaluate(async () => {
      const axeRuntime = (
        window as typeof window & {
          axe: {
            run: (
              context: Document,
              options: {
                runOnly: { type: "tag"; values: string[] };
              },
            ) => Promise<{
              violations: Array<{
                help: string;
                id: string;
                impact: string | null;
                nodes: Array<{ html: string; target: string[] }>;
              }>;
            }>;
          };
        }
      ).axe;

      const results = await axeRuntime.run(document, {
        runOnly: {
          type: "tag",
          values: ["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"],
        },
      });

      return results.violations.map((violation) => ({
        help: violation.help,
        id: violation.id,
        impact: violation.impact,
        nodes: violation.nodes.map((node) => ({
          html: node.html,
          target: node.target,
        })),
      }));
    });

    expect(violations, JSON.stringify(violations, null, 2)).toEqual([]);
  });
}

test("keyboard users can skip navigation and see focus", async ({ page }) => {
  await page.goto("/sites/demo");
  await page.keyboard.press("Tab");

  const focused = page.locator(":focus");
  await expect(focused).toHaveText("Skip to main content");
  await expect(focused).toBeVisible();

  const outline = await focused.evaluate((element) => {
    const style = getComputedStyle(element);
    return {
      color: style.outlineColor,
      style: style.outlineStyle,
      width: style.outlineWidth,
    };
  });
  expect(outline.style).not.toBe("none");
  expect(outline.width).not.toBe("0px");

  await page.keyboard.press("Enter");
  await expect(page.locator("#page-content")).toBeFocused();
});

test("reduced-motion preference disables nonessential animation", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/sites/demo");

  const duration = await page
    .locator(".img-zoom img")
    .first()
    .evaluate((element) => getComputedStyle(element).transitionDuration);
  expect(Number.parseFloat(duration)).toBeLessThanOrEqual(0.00001);
});
