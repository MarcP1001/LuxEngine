"use client";

import { useState } from "react";
import {
  DndContext,
  KeyboardSensor,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  rectSortingStrategy,
  useSortable,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { Doc } from "../convex/_generated/dataModel";
import ListingCard from "./ListingCard";

type Listing = Doc<"listings">;

function SortableItem({ listing }: { listing: Listing }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: listing._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : ("auto" as const),
  };

  return (
    <div ref={setNodeRef} style={style} className="relative group/sort">
      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        aria-label={`Reorder ${listing.address}`}
        className="absolute -top-0.5 left-1/2 -translate-x-1/2 z-10 min-w-6 min-h-6 opacity-0 group-hover/sort:opacity-100 focus:opacity-100 transition-opacity cursor-grab active:cursor-grabbing bg-surface border border-surface-border px-3 py-1 rounded-b"
      >
        <svg width="14" height="6" viewBox="0 0 14 6" fill="none">
          <path d="M0 1h14M0 5h14" stroke="#A0A4A6" strokeWidth="1" />
        </svg>
      </div>
      <ListingCard listing={listing} />
    </div>
  );
}

export default function SortableListingGrid({
  listings,
}: {
  listings: Listing[];
}) {
  const reorder = useMutation(api.listings.reorderListings);
  const [localOrder, setLocalOrder] = useState<string[] | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  // Sort listings by sortOrder (fallback to creation time)
  const sorted = [...listings].sort((a, b) => {
    const aOrder = a.sortOrder ?? a._creationTime;
    const bOrder = b.sortOrder ?? b._creationTime;
    return aOrder - bOrder;
  });

  // If user has dragged, use local order; otherwise use sorted
  const ordered = localOrder
    ? (localOrder
        .map((id) => sorted.find((l) => l._id === id))
        .filter(Boolean) as Listing[])
    : sorted;

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const ids = ordered.map((l) => l._id as string);
    const activeId = active.id as string;
    const overId = over.id as string;
    const oldIndex = ids.indexOf(activeId);
    const newIndex = ids.indexOf(overId);
    if (oldIndex === -1 || newIndex === -1) return;

    // Reorder locally
    const newIds = [...ids];
    newIds.splice(oldIndex, 1);
    newIds.splice(newIndex, 0, activeId);
    setLocalOrder(newIds);

    // Persist to DB
    const items = newIds.map((id, i) => ({
      id: id as Doc<"listings">["_id"],
      sortOrder: i,
    }));
    void reorder({ items });
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={ordered.map((l) => l._id)}
        strategy={rectSortingStrategy}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {ordered.map((listing) => (
            <SortableItem key={listing._id} listing={listing} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
