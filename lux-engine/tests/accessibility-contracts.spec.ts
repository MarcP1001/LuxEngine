import { expect, test } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const css = fs.readFileSync(
  path.resolve(__dirname, "../app/globals.css"),
  "utf8",
);

function themeColor(name: string): string {
  const match = css.match(new RegExp(`--color-${name}:\\s*(#[0-9a-fA-F]{6})`));
  if (!match) throw new Error(`Missing theme color: ${name}`);
  return match[1];
}

function luminance(hex: string): number {
  const channels = hex.slice(1).match(/.{2}/g);
  if (!channels) throw new Error(`Invalid color: ${hex}`);

  const [red, green, blue] = channels.map((channel) => {
    const value = Number.parseInt(channel, 16) / 255;
    return value <= 0.04045
      ? value / 12.92
      : Math.pow((value + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

function contrast(foreground: string, background: string): number {
  const foregroundLuminance = luminance(foreground);
  const backgroundLuminance = luminance(background);
  return (
    (Math.max(foregroundLuminance, backgroundLuminance) + 0.05) /
    (Math.min(foregroundLuminance, backgroundLuminance) + 0.05)
  );
}

test.describe("theme contrast contracts", () => {
  test("secondary text passes WCAG AA on every dark surface", () => {
    const secondary = themeColor("gunmetal");

    expect(
      contrast(secondary, themeColor("obsidian-deep")),
    ).toBeGreaterThanOrEqual(4.5);
    expect(contrast(secondary, themeColor("surface"))).toBeGreaterThanOrEqual(
      4.5,
    );
  });

  test("orange text and filled controls use accessible pairings", () => {
    const accent = themeColor("cinnabar");

    expect(contrast(accent, themeColor("surface"))).toBeGreaterThanOrEqual(4.5);
    expect(
      contrast(themeColor("obsidian-deep"), accent),
    ).toBeGreaterThanOrEqual(4.5);
    expect(css).toContain(".bg-cinnabar,");
    expect(css).toContain("color: #111111 !important;");
  });

  test("component borders remain distinguishable from surfaces", () => {
    const border = themeColor("surface-border");

    expect(
      contrast(border, themeColor("obsidian-deep")),
    ).toBeGreaterThanOrEqual(3);
    expect(contrast(border, themeColor("surface"))).toBeGreaterThanOrEqual(3);
  });
});
