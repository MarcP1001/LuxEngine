"use client";

import { useEffect, useRef, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../convex/_generated/api";

interface Props {
  onClose: () => void;
}

const PROP_TYPES = [
  "Single Family",
  "Condo",
  "Townhouse",
  "Penthouse",
  "Villa",
  "Estate",
  "Land",
  "Multi-Family",
];
const MLS_OPTIONS = ["ARMLS", "CRMLS", "NTREIS", "FMLS", "MRED", "Other"];

export default function AddListingModal({ onClose }: Props) {
  const addListing = useMutation(api.listings.addManualListing);
  const dialogRef = useRef<HTMLDivElement>(null);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageInputs, setImageInputs] = useState<string[]>([""]);

  const [form, setForm] = useState({
    address: "",
    city: "",
    state: "",
    zip: "",
    price: "",
    beds: "",
    baths: "",
    sqFt: "",
    propType: "Single Family",
    yearBuilt: "",
    listingOfficeName: "",
    mlsName: "ARMLS",
    publicRemarks: "",
  });

  useEffect(() => {
    const previousFocus =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    dialogRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
      if (event.key !== "Tab" || !dialogRef.current) return;

      const focusable = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
        ),
      );
      if (focusable.length === 0) {
        event.preventDefault();
        dialogRef.current.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      previousFocus?.focus();
    };
  }, [onClose]);

  function set(field: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function addImageField() {
    setImageInputs((i) => [...i, ""]);
  }

  function setImage(idx: number, val: string) {
    setImageInputs((imgs) => imgs.map((img, i) => (i === idx ? val : img)));
  }

  function removeImage(idx: number) {
    setImageInputs((imgs) => imgs.filter((_, i) => i !== idx));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.address || !form.city || !form.state || !form.price) {
      setError("Address, city, state, and price are required.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const images = imageInputs.map((u) => u.trim()).filter(Boolean);
      await addListing({
        address: form.address.trim(),
        city: form.city.trim(),
        state: form.state.trim().toUpperCase(),
        zip: form.zip.trim(),
        price: parseFloat(form.price.replace(/[^0-9.]/g, "")),
        beds: form.beds ? parseFloat(form.beds) : undefined,
        baths: form.baths ? parseFloat(form.baths) : undefined,
        sqFt: form.sqFt ? parseInt(form.sqFt) : undefined,
        propType: form.propType || undefined,
        yearBuilt: form.yearBuilt ? parseInt(form.yearBuilt) : undefined,
        listingOfficeName: form.listingOfficeName.trim() || undefined,
        mlsName: form.mlsName || undefined,
        publicRemarks: form.publicRemarks.trim() || undefined,
        images,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add listing");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-stretch justify-end">
      {/* Backdrop */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-obsidian-deep/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-listing-title"
        tabIndex={-1}
        className="relative z-10 w-full max-w-xl bg-surface border-l border-surface-border flex flex-col h-full overflow-hidden shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-surface-border flex-shrink-0">
          <div>
            <p className="text-[9px] tracking-[0.4em] uppercase text-gunmetal mb-1">
              New Listing
            </p>
            <h2
              id="add-listing-title"
              style={{ fontFamily: "var(--font-playfair)" }}
              className="text-white text-xl font-normal"
            >
              Add Manually
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close add listing dialog"
            className="w-8 h-8 border border-surface-border text-gunmetal hover:border-gunmetal hover:text-white flex items-center justify-center transition-colors duration-200"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path
                d="M1 1l10 10M11 1L1 11"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        {/* Scrollable form body */}
        <form
          onSubmit={handleSubmit}
          className="flex flex-col flex-1 overflow-y-auto"
        >
          <div className="px-8 py-6 flex flex-col gap-8">
            {/* Section: Property Details */}
            <section className="flex flex-col gap-5">
              <SectionLabel>Property Details</SectionLabel>

              <Field label="Street Address *">
                <input
                  type="text"
                  value={form.address}
                  onChange={(e) => set("address", e.target.value)}
                  placeholder="7832 E Camelback Road"
                  required
                  className={inputCls}
                />
              </Field>

              <div className="grid grid-cols-3 gap-3">
                <Field label="City *">
                  <input
                    type="text"
                    value={form.city}
                    onChange={(e) => set("city", e.target.value)}
                    placeholder="Scottsdale"
                    required
                    className={inputCls}
                  />
                </Field>
                <Field label="State *">
                  <input
                    type="text"
                    value={form.state}
                    onChange={(e) => set("state", e.target.value)}
                    placeholder="AZ"
                    maxLength={2}
                    required
                    className={inputCls}
                  />
                </Field>
                <Field label="ZIP">
                  <input
                    type="text"
                    value={form.zip}
                    onChange={(e) => set("zip", e.target.value)}
                    placeholder="85251"
                    className={inputCls}
                  />
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Property Type">
                  <select
                    value={form.propType}
                    onChange={(e) => set("propType", e.target.value)}
                    className={selectCls}
                  >
                    {PROP_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Year Built">
                  <input
                    type="number"
                    value={form.yearBuilt}
                    onChange={(e) => set("yearBuilt", e.target.value)}
                    placeholder="2021"
                    min="1800"
                    max={new Date().getFullYear() + 2}
                    className={inputCls}
                  />
                </Field>
              </div>
            </section>

            {/* Section: Pricing & Size */}
            <section className="flex flex-col gap-5">
              <SectionLabel>Pricing & Size</SectionLabel>

              <Field label="List Price *">
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gunmetal text-sm">
                    $
                  </span>
                  <input
                    type="text"
                    value={form.price}
                    onChange={(e) => set("price", e.target.value)}
                    placeholder="3,495,000"
                    required
                    className={`${inputCls} pl-8`}
                  />
                </div>
              </Field>

              <div className="grid grid-cols-3 gap-3">
                <Field label="Bedrooms">
                  <input
                    type="number"
                    value={form.beds}
                    onChange={(e) => set("beds", e.target.value)}
                    placeholder="5"
                    min="0"
                    step="1"
                    className={inputCls}
                  />
                </Field>
                <Field label="Bathrooms">
                  <input
                    type="number"
                    value={form.baths}
                    onChange={(e) => set("baths", e.target.value)}
                    placeholder="5.5"
                    min="0"
                    step="0.5"
                    className={inputCls}
                  />
                </Field>
                <Field label="Sq Footage">
                  <input
                    type="number"
                    value={form.sqFt}
                    onChange={(e) => set("sqFt", e.target.value)}
                    placeholder="6200"
                    min="0"
                    className={inputCls}
                  />
                </Field>
              </div>
            </section>

            {/* Section: Photos */}
            <section className="flex flex-col gap-5">
              <SectionLabel>Photos</SectionLabel>
              <p className="text-gunmetal text-xs -mt-2">
                Enter image URLs. Unsplash, your CDN, or MLS photo links all
                work.
              </p>

              <div className="flex flex-col gap-2">
                {imageInputs.map((url, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
                    <input
                      type="url"
                      value={url}
                      onChange={(e) => setImage(idx, e.target.value)}
                      placeholder={`https://...photo-${idx + 1}.jpg`}
                      className={`${inputCls} flex-1`}
                    />
                    {imageInputs.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeImage(idx)}
                        aria-label={`Remove photo URL ${idx + 1}`}
                        className="w-9 h-9 flex-shrink-0 border border-surface-border text-gunmetal hover:border-cinnabar/50 hover:text-cinnabar flex items-center justify-center transition-colors duration-200"
                      >
                        <svg
                          width="10"
                          height="10"
                          viewBox="0 0 10 10"
                          fill="none"
                        >
                          <path
                            d="M1 1l8 8M9 1L1 9"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                          />
                        </svg>
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addImageField}
                  className="self-start text-[9px] tracking-[0.3em] uppercase text-gunmetal hover:text-sulfur border border-surface-border px-4 py-2 hover:border-sulfur/30 transition-colors duration-200"
                >
                  + Add Photo
                </button>
              </div>
            </section>

            {/* Section: Description */}
            <section className="flex flex-col gap-5">
              <SectionLabel>Description</SectionLabel>

              <Field label="MLS Remarks">
                <textarea
                  value={form.publicRemarks}
                  onChange={(e) => set("publicRemarks", e.target.value)}
                  placeholder="Property description — used as the source for AI narrative generation."
                  rows={4}
                  className={`${inputCls} resize-none`}
                />
              </Field>
            </section>

            {/* Section: Attribution */}
            <section className="flex flex-col gap-5">
              <SectionLabel>IDX Attribution</SectionLabel>
              <p className="text-gunmetal text-xs -mt-2">
                Required for compliance display on generated sites.
              </p>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Listing Office">
                  <input
                    type="text"
                    value={form.listingOfficeName}
                    onChange={(e) => set("listingOfficeName", e.target.value)}
                    placeholder="Sotheby's International"
                    className={inputCls}
                  />
                </Field>
                <Field label="MLS Name">
                  <select
                    value={form.mlsName}
                    onChange={(e) => set("mlsName", e.target.value)}
                    className={selectCls}
                  >
                    {MLS_OPTIONS.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
            </section>
          </div>

          {/* Sticky footer */}
          <div className="flex-shrink-0 px-8 py-5 border-t border-surface-border bg-surface flex flex-col gap-3">
            {error && (
              <p
                role="alert"
                className="text-cinnabar text-xs border border-cinnabar/30 bg-cinnabar/5 px-3 py-2"
              >
                {error}
              </p>
            )}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 border border-surface-border text-gunmetal text-[9px] tracking-[0.3em] uppercase hover:border-gunmetal hover:text-white transition-colors duration-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 py-3 bg-cinnabar text-white text-[9px] tracking-[0.3em] uppercase font-medium hover:bg-cinnabar-dark transition-colors duration-300 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" />
                    Saving...
                  </span>
                ) : (
                  "Add Listing"
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

const inputCls =
  "w-full bg-obsidian-deep border border-surface-border text-white text-sm px-4 py-2.5 focus:outline-none focus:border-gunmetal placeholder:text-gunmetal transition-colors duration-200";

const selectCls =
  "w-full bg-obsidian-deep border border-surface-border text-white text-sm px-4 py-2.5 focus:outline-none focus:border-gunmetal transition-colors duration-200 cursor-pointer appearance-none";

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-4 h-px bg-sulfur/60" />
      <p className="text-[9px] tracking-[0.4em] uppercase text-gunmetal">
        {children}
      </p>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[9px] tracking-[0.3em] uppercase text-gunmetal">
        {label}
      </span>
      {children}
    </label>
  );
}
