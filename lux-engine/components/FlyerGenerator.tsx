"use client";

import { useCallback } from "react";
import QRCode from "qrcode";
import { jsPDF } from "jspdf";

interface FlyerProps {
  address: string;
  city: string;
  state: string;
  zip: string;
  price: number;
  beds?: number;
  baths?: number;
  sqFt?: number;
  heroImage?: string;
  subdomain: string;
  narrative?: string;
  listingOfficeName?: string;
  mlsName?: string;
  agentId?: string;
}

export function useGenerateFlyer() {
  return useCallback(async (props: FlyerProps) => {
    const siteUrl = `${window.location.origin}/sites/${props.subdomain}`;
    const doc = new jsPDF({ orientation: "portrait", unit: "in", format: "letter" });

    const W = 8.5;
    const H = 11;
    const M = 0.6; // margin

    // ── Background
    doc.setFillColor(26, 26, 26); // obsidian
    doc.rect(0, 0, W, H, "F");

    // ── Try to load hero image
    let imgLoaded = false;
    if (props.heroImage) {
      try {
        const dataUrl = await imageToDataUrl(props.heroImage, W * 96, 5.5 * 96);
        doc.addImage(dataUrl, "JPEG", 0, 0, W, 5.5);
        // Dark band at bottom of image for text readability
        doc.setFillColor(26, 26, 26);
        doc.rect(0, 4.2, W, 1.3, "F");
        imgLoaded = true;
      } catch {
        // If image fails to load, continue without it
      }
    }

    const contentTop = imgLoaded ? 4.5 : 1.5;

    // ── Sulfur accent line
    doc.setDrawColor(242, 255, 0);
    doc.setLineWidth(0.02);
    doc.line(M, contentTop, M + 1.2, contentTop);

    // ── "LUX ENGINE" label
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(242, 255, 0);
    doc.text("LUX ENGINE", M, contentTop + 0.25);

    // ── Address
    doc.setFont("helvetica", "bold");
    doc.setFontSize(28);
    doc.setTextColor(255, 255, 255);
    doc.text(props.address, M, contentTop + 0.7, { maxWidth: W - M * 2 - 2 });

    // ── City, State ZIP
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(84, 88, 90); // gunmetal
    doc.text(`${props.city}, ${props.state} ${props.zip}`, M, contentTop + 1.05);

    // ── Price
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(242, 255, 0);
    doc.text(`$${props.price.toLocaleString()}`, M, contentTop + 1.5);

    // ── Specs
    const specs: string[] = [];
    if (props.beds !== undefined) specs.push(`${props.beds} Bed`);
    if (props.baths !== undefined) specs.push(`${props.baths} Bath`);
    if (props.sqFt !== undefined) specs.push(`${props.sqFt.toLocaleString()} SF`);

    if (specs.length > 0) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(84, 88, 90);
      doc.text(specs.join("  |  "), M, contentTop + 1.85);
    }

    // ── Narrative snippet
    if (props.narrative) {
      const snippet = props.narrative.split(/[.!?]/).slice(0, 2).join(". ").trim() + ".";
      doc.setFont("helvetica", "italic");
      doc.setFontSize(10);
      doc.setTextColor(180, 180, 180);
      const lines = doc.splitTextToSize(snippet, W - M * 2 - 2);
      doc.text(lines, M, contentTop + 2.2);
    }

    // ── QR Code (bottom-right)
    const qrSize = 1.5;
    const qrX = W - M - qrSize;
    const qrY = H - M - qrSize - 0.5;

    try {
      const qrDataUrl = await QRCode.toDataURL(siteUrl, {
        width: 300,
        margin: 1,
        color: { dark: "#F2FF00", light: "#1A1A1A" },
      });
      doc.addImage(qrDataUrl, "PNG", qrX, qrY, qrSize, qrSize);
    } catch {
      // QR generation failed — skip
    }

    // ── "Scan to view" label under QR
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(84, 88, 90);
    doc.text("SCAN TO VIEW PROPERTY", qrX + qrSize / 2, qrY + qrSize + 0.2, { align: "center" });

    // ── IDX Compliance footer
    const footerY = H - 0.35;
    doc.setFontSize(6);
    doc.setTextColor(84, 88, 90);
    const attribution = [
      props.listingOfficeName && `Listing courtesy of ${props.listingOfficeName}`,
      props.mlsName && `via ${props.mlsName}`,
      "Information deemed reliable but not guaranteed.",
    ]
      .filter(Boolean)
      .join(". ");
    doc.text(attribution, M, footerY, { maxWidth: W - M * 2 });

    // ── Download
    const slug = props.address.replace(/[^a-zA-Z0-9]+/g, "-").toLowerCase();
    doc.save(`${slug}-flyer.pdf`);
  }, []);
}

/** Convert a remote image URL to a JPEG data URL via canvas */
function imageToDataUrl(url: string, width: number, height: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) { reject(new Error("Canvas not supported")); return; }
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL("image/jpeg", 0.85));
    };
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = url;
  });
}
