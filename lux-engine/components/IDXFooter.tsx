/**
 * IDXFooter — Compliance Component
 *
 * IMPORTANT: This component must never be hidden via CSS or display:none.
 * Real estate compliance requires IDX attribution to be visible on all
 * pages displaying IDX data. Using inline `style` ensures it cannot be
 * overridden by Tailwind utilities.
 */
export default function IDXFooter({
  listingOfficeName,
  mlsName,
}: {
  listingOfficeName?: string;
  mlsName?: string;
}) {
  return (
    <div
      style={{ display: "block", visibility: "visible" }}
      className="border-t border-gunmetal pt-2 mt-1"
    >
      <div className="flex items-start gap-2">
        {/* IDX Logo mark */}
        <div className="flex-shrink-0 mt-0.5">
          <div
            style={{ display: "block" }}
            className="w-5 h-5 border border-gunmetal flex items-center justify-center"
          >
            <span className="text-[7px] text-gunmetal font-bold tracking-tight leading-none">
              IDX
            </span>
          </div>
        </div>

        <p className="text-gunmetal text-[10px] leading-relaxed">
          {listingOfficeName ? (
            <>
              Listing provided courtesy of{" "}
              <span className="text-gunmetal">{listingOfficeName}</span>
              {mlsName ? ` via ${mlsName}` : ""}.{" "}
            </>
          ) : (
            <>Listing information provided via IDX. </>
          )}
          Information deemed reliable but not guaranteed. This site is not the
          official MLS site and does not represent all listings.
        </p>
      </div>
    </div>
  );
}
