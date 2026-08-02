"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useAction } from "convex/react";
import { api } from "../convex/_generated/api";
import { Doc } from "../convex/_generated/dataModel";
import dynamic from "next/dynamic";

type Listing = Doc<"listings">;

// Dynamically import the map to avoid SSR issues with Leaflet
const MapInner = dynamic(() => import("./ListingMapInner"), { ssr: false });

interface ListingMapProps {
  listings: Listing[];
}

export default function ListingMap({ listings }: ListingMapProps) {
  const geocode = useAction(api.listings.geocodeListing);
  const [routeMode, setRouteMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [routePolyline, setRoutePolyline] = useState<[number, number][] | null>(
    null,
  );
  const [routeInfo, setRouteInfo] = useState<{
    distance: string;
    duration: string;
  } | null>(null);
  const [loadingRoute, setLoadingRoute] = useState(false);

  // Geocode listings that don't have lat/lng yet
  useEffect(() => {
    for (const l of listings) {
      if (l.lat === undefined || l.lng === undefined) {
        void geocode({ id: l._id });
      }
    }
  }, [listings, geocode]);

  const geoListings = useMemo(
    () => listings.filter((l) => l.lat !== undefined && l.lng !== undefined),
    [listings],
  );

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    setRoutePolyline(null);
    setRouteInfo(null);
  }, []);

  async function calculateRoute() {
    const waypoints = geoListings
      .filter((l) => selectedIds.has(l._id))
      .map((l) => [l.lng!, l.lat!] as [number, number]);

    if (waypoints.length < 2) return;

    setLoadingRoute(true);
    try {
      const coords = waypoints.map((w) => `${w[0]},${w[1]}`).join(";");
      const res = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson`,
      );
      const data = await res.json();
      if (data.routes?.[0]) {
        const route = data.routes[0];
        const polyline: [number, number][] = route.geometry.coordinates.map(
          (c: [number, number]) => [c[1], c[0]], // GeoJSON is [lng, lat], Leaflet wants [lat, lng]
        );
        setRoutePolyline(polyline);
        setRouteInfo({
          distance: (route.distance / 1609.34).toFixed(1) + " mi",
          duration: Math.round(route.duration / 60) + " min",
        });
      }
    } catch {
      // Route calculation failed silently
    } finally {
      setLoadingRoute(false);
    }
  }

  if (geoListings.length === 0) {
    return (
      <div className="border border-surface-border bg-surface p-8 text-center">
        <p className="text-gunmetal text-sm">
          Geocoding addresses... Map will appear shortly.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setRouteMode(!routeMode);
              setSelectedIds(new Set());
              setRoutePolyline(null);
              setRouteInfo(null);
            }}
            className={`px-4 py-2 text-[9px] tracking-[0.3em] uppercase transition-all duration-200 ${
              routeMode
                ? "bg-sulfur text-obsidian font-semibold"
                : "border border-surface-border text-gunmetal hover:border-gunmetal hover:text-white"
            }`}
          >
            {routeMode ? "Exit Route Planner" : "Plan Route"}
          </button>
          {routeMode && selectedIds.size >= 2 && (
            <button
              onClick={calculateRoute}
              disabled={loadingRoute}
              className="bg-cinnabar text-white px-4 py-2 text-[9px] tracking-[0.3em] uppercase hover:bg-cinnabar-dark transition-colors disabled:opacity-30"
            >
              {loadingRoute
                ? "Calculating..."
                : `Route ${selectedIds.size} Properties`}
            </button>
          )}
          {routeMode && selectedIds.size < 2 && (
            <p className="text-gunmetal text-[10px] tracking-wide">
              Select 2+ properties to route
            </p>
          )}
        </div>
        {routeInfo && (
          <div className="flex items-center gap-4">
            <span className="text-sulfur text-sm font-mono">
              {routeInfo.distance}
            </span>
            <span className="text-gunmetal text-[10px]">|</span>
            <span className="text-sulfur text-sm font-mono">
              {routeInfo.duration}
            </span>
          </div>
        )}
      </div>

      {/* Route property list (when in route mode) */}
      {routeMode && selectedIds.size > 0 && (
        <div className="flex flex-wrap gap-2">
          {geoListings
            .filter((l) => selectedIds.has(l._id))
            .map((l, i) => (
              <span
                key={l._id}
                className="flex items-center gap-2 bg-surface border border-sulfur/30 px-3 py-1.5 text-[10px] text-white"
              >
                <span className="w-4 h-4 bg-sulfur text-obsidian text-[9px] font-bold flex items-center justify-center">
                  {i + 1}
                </span>
                {l.address}
                <button
                  onClick={() => toggleSelect(l._id)}
                  aria-label={`Remove ${l.address} from route`}
                  className="min-w-6 min-h-6 text-gunmetal hover:text-cinnabar ml-1"
                >
                  x
                </button>
              </span>
            ))}
        </div>
      )}

      {/* Map */}
      <div
        className="border border-surface-border overflow-hidden"
        style={{ height: "500px" }}
      >
        <MapInner
          listings={geoListings}
          routeMode={routeMode}
          selectedIds={selectedIds}
          onToggleSelect={toggleSelect}
          routePolyline={routePolyline}
        />
      </div>
    </div>
  );
}
