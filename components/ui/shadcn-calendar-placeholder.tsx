"use client";
// Placeholder calendar component. Replace with react-day-picker or other lib for full functionality.
import * as React from "react";
interface CalendarProps {
  selected?: Date;
  onSelect?: (date: Date | undefined) => void;
}

export function Calendar({ selected, onSelect }: CalendarProps) {
  // For now just render a simple input type=date. You can upgrade later.
  return (
    <input
      type="date"
      value={selected ? selected.toISOString().substring(0, 10) : ""}
      onChange={(e) => {
        const v = e.target.value;
        if (!v) onSelect?.(undefined);
        else onSelect?.(new Date(v + "T00:00:00"));
      }}
      className="border border-border rounded-md px-2 py-1 text-sm bg-background"
    />
  );
}
