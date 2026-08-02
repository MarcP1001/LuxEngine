"use client";

import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Doc } from "../convex/_generated/dataModel";

type Listing = Doc<"listings">;

// Custom sulfur-colored marker
function createMarkerIcon(selected: boolean, index?: number) {
  const color = selected ? "#F2FF00" : "#D35400";
  const label = index !== undefined ? `${index + 1}` : "";
  return L.divIcon({
    className: "",
    iconSize: [28, 28],
    iconAnchor: [14, 28],
    popupAnchor: [0, -28],
    html: `<div style="
      width:28px;height:28px;
      background:${color};
      border:2px solid ${selected ? "#1A1A1A" : "#fff"};
      border-radius:50% 50% 50% 0;
      transform:rotate(-45deg);
      display:flex;align-items:center;justify-content:center;
    "><span style="
      transform:rotate(45deg);
      font-size:10px;font-weight:700;
      color:${selected ? "#1A1A1A" : "#fff"};
    ">${label}</span></div>`,
  });
}

function FitBounds({ listings }: { listings: Listing[] }) {
  const map = useMap();
  const fitted = useRef(false);
  useEffect(() => {
    if (listings.length > 0 && !fitted.current) {
      const bounds = L.latLngBounds(
        listings.map((l) => [l.lat!, l.lng!] as [number, number])
      );
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
      fitted.current = true;
    }
  }, [listings, map]);
  return null;
}

interface MapInnerProps {
  listings: Listing[];
  routeMode: boolean;
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  routePolyline: [number, number][] | null;
}

export default function ListingMapInner({
  listings,
  routeMode,
  selectedIds,
  onToggleSelect,
  routePolyline,
}: MapInnerProps) {
  const fmt = (n: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

  // For route mode, track selection order
  const selectedList = listings.filter((l) => selectedIds.has(l._id));

  const defaultCenter: [number, number] = listings.length > 0
    ? [listings[0].lat!, listings[0].lng!]
    : [33.4484, -111.9490]; // Scottsdale default

  return (
    <MapContainer
      center={defaultCenter}
      zoom={12}
      style={{ height: "100%", width: "100%", background: "#1A1A1A" }}
      zoomControl={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://carto.com/">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      />
      <FitBounds listings={listings} />

      {listings.map((listing) => {
        const isSelected = selectedIds.has(listing._id);
        const selIndex = selectedList.findIndex((l) => l._id === listing._id);
        return (
          <Marker
            key={listing._id}
            position={[listing.lat!, listing.lng!]}
            icon={createMarkerIcon(isSelected, isSelected ? selIndex : undefined)}
            eventHandlers={{
              click: () => {
                if (routeMode) onToggleSelect(listing._id);
              },
            }}
          >
            {!routeMode && (
              <Popup>
                <div style={{ fontFamily: "sans-serif", minWidth: 180 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, margin: "0 0 4px", color: "#1A1A1A" }}>
                    {listing.address}
                  </p>
                  <p style={{ fontSize: 12, color: "#54585A", margin: "0 0 4px" }}>
                    {listing.city}, {listing.state}
                  </p>
                  <p style={{ fontSize: 14, fontWeight: 700, color: "#D35400", margin: 0 }}>
                    {fmt(listing.price)}
                  </p>
                  <p style={{ fontSize: 11, color: "#54585A", margin: "4px 0 0" }}>
                    {[
                      listing.beds && `${listing.beds} Bed`,
                      listing.baths && `${listing.baths} Bath`,
                      listing.sqFt && `${listing.sqFt.toLocaleString()} SF`,
                    ].filter(Boolean).join(" · ")}
                  </p>
                </div>
              </Popup>
            )}
          </Marker>
        );
      })}

      {routePolyline && (
        <Polyline
          positions={routePolyline}
          pathOptions={{ color: "#F2FF00", weight: 3, opacity: 0.8, dashArray: "8 4" }}
        />
      )}
    </MapContainer>
  );
}
