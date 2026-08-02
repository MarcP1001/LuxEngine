"use client";

import { useCallback, useState } from "react";

type PreviewData = {
  address: string;
  city: string;
  state: string;
  zip: string;
  price: number;
  beds?: number;
  baths?: number;
  sqFt?: number;
  heroImage?: string;
  narrative?: string;
  subdomain: string;
};

export function useGenerateSocialPreview() {
  const [generating, setGenerating] = useState(false);

  const generate = useCallback(async (data: PreviewData) => {
    setGenerating(true);
    try {
      const canvas = document.createElement("canvas");
      canvas.width = 1200;
      canvas.height = 630;
      const ctx = canvas.getContext("2d")!;

      // Background
      ctx.fillStyle = "#1A1A1A";
      ctx.fillRect(0, 0, 1200, 630);

      // Load hero image if available
      if (data.heroImage) {
        try {
          const img = await loadImage(data.heroImage);
          ctx.globalAlpha = 0.4;
          const scale = Math.max(1200 / img.width, 630 / img.height);
          const w = img.width * scale;
          const h = img.height * scale;
          ctx.drawImage(img, (1200 - w) / 2, (630 - h) / 2, w, h);
          ctx.globalAlpha = 1;
        } catch {
          // Image load failed — use plain background
        }
      }

      // Gradient overlay
      const grad = ctx.createLinearGradient(0, 0, 0, 630);
      grad.addColorStop(0, "rgba(26,26,26,0.3)");
      grad.addColorStop(0.5, "rgba(26,26,26,0.6)");
      grad.addColorStop(1, "rgba(26,26,26,0.95)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 1200, 630);

      // Left gradient
      const leftGrad = ctx.createLinearGradient(0, 0, 600, 0);
      leftGrad.addColorStop(0, "rgba(26,26,26,0.8)");
      leftGrad.addColorStop(1, "transparent");
      ctx.fillStyle = leftGrad;
      ctx.fillRect(0, 0, 600, 630);

      // Sulfur accent line
      ctx.fillStyle = "#F2FF00";
      ctx.fillRect(60, 320, 40, 2);

      // Location
      ctx.fillStyle = "#A0A4A6";
      ctx.font = "500 11px system-ui, sans-serif";
      ctx.letterSpacing = "6px";
      ctx.fillText(`${data.city.toUpperCase()} · ${data.state.toUpperCase()} ${data.zip}`, 60, 310);

      // Address
      ctx.fillStyle = "#FFFFFF";
      ctx.font = "300 48px Georgia, serif";
      ctx.letterSpacing = "0px";
      const addressLines = wrapText(ctx, data.address, 700);
      let y = 370;
      for (const line of addressLines) {
        ctx.fillText(line, 60, y);
        y += 58;
      }

      // Price
      ctx.fillStyle = "#F2FF00";
      ctx.font = "300 42px Georgia, serif";
      const fmt = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
      ctx.fillText(fmt.format(data.price), 60, y + 20);

      // Stats
      const stats: string[] = [];
      if (data.beds) stats.push(`${data.beds} Beds`);
      if (data.baths) stats.push(`${data.baths} Baths`);
      if (data.sqFt) stats.push(`${data.sqFt.toLocaleString()} SF`);
      if (stats.length) {
        ctx.fillStyle = "#A0A4A6";
        ctx.font = "400 14px system-ui, sans-serif";
        ctx.letterSpacing = "3px";
        ctx.fillText(stats.join("  ·  ").toUpperCase(), 60, y + 60);
      }

      // Narrative snippet (right side)
      if (data.narrative) {
        ctx.fillStyle = "rgba(255,255,255,0.5)";
        ctx.font = "italic 18px Georgia, serif";
        ctx.letterSpacing = "0px";
        const snippetLines = wrapText(ctx, `"${data.narrative.slice(0, 200)}${data.narrative.length > 200 ? "..." : ""}"`, 400);
        let ny = 350;
        for (const line of snippetLines.slice(0, 5)) {
          ctx.fillText(line, 740, ny);
          ny += 26;
        }
      }

      // Branding
      ctx.fillStyle = "#F2FF00";
      ctx.font = "500 12px system-ui, sans-serif";
      ctx.letterSpacing = "8px";
      ctx.fillText("LUX ENGINE", 60, 60);

      // URL
      ctx.fillStyle = "#A0A4A6";
      ctx.font = "400 12px system-ui, sans-serif";
      ctx.letterSpacing = "2px";
      ctx.fillText(`${data.subdomain}.luxengine.io`, 60, 590);

      // Border
      ctx.strokeStyle = "#F2FF00";
      ctx.lineWidth = 2;
      ctx.strokeRect(1, 1, 1198, 628);

      // Download
      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${data.address.replace(/\s+/g, "-").toLowerCase()}-social.png`;
        a.click();
        URL.revokeObjectURL(url);
      }, "image/png");
    } finally {
      setGenerating(false);
    }
  }, []);

  return { generate, generating };
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let line = "";

  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

export function SocialPreviewButton({ data }: { data: PreviewData }) {
  const { generate, generating } = useGenerateSocialPreview();

  return (
    <button
      onClick={() => generate(data)}
      disabled={generating}
      className="border border-surface-border text-gunmetal text-[9px] tracking-[0.35em] uppercase px-4 py-2 hover:border-gunmetal hover:text-white transition-all duration-300 disabled:opacity-50 flex items-center gap-2"
    >
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="2" y="2" width="20" height="20" rx="2" />
        <path d="M16 8h.01M2 14l5.5-5.5a2 2 0 013 0L18 16M14 12l2-2a2 2 0 013 0l3 3" />
      </svg>
      {generating ? "Generating..." : "Social Image"}
    </button>
  );
}
