"use client";

import { useState, useEffect, useRef } from "react";
import { format } from "date-fns";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

interface DateTimePickerProps {
  value?: string; // ISO string
  onChange: (value: string) => void;
  label?: string;
  disabled?: boolean;
  required?: boolean;
  minDate?: Date;
}

// NOTE: This is a minimal placeholder until a calendar component is implemented.
// If you already have a calendar (e.g., react-day-picker), replace the Calendar import & body accordingly.
export function DateTimePicker({
  value,
  onChange,
  label = "Match Date & Time",
  disabled,
  required,
  minDate,
}: DateTimePickerProps) {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState<Date | null>(value ? new Date(value) : null);
  const [hours, setHours] = useState<string>(
    date ? String(date.getHours()).padStart(2, "0") : "12"
  );
  const [minutes, setMinutes] = useState<string>(
    date ? String(date.getMinutes()).padStart(2, "0") : "00"
  );
  // Keep latest onChange without re-triggering effect
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  // Note: We intentionally don't resync internal state when `value` changes
  // after mount to avoid feedback loops and lint errors. The picker initializes
  // from `value` on first render and then becomes locally controlled.

  useEffect(() => {
    if (date) {
      const updated = new Date(date);
      updated.setHours(parseInt(hours, 10));
      updated.setMinutes(parseInt(minutes, 10));
      onChangeRef.current(updated.toISOString());
    }
    // Do not depend on onChange to prevent infinite loops from new function identities
  }, [date, hours, minutes]);

  return (
    <div className="space-y-1">
      {label && (
        <Label className="block">
          {label}
          {required && " *"}
        </Label>
      )}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            disabled={disabled}
            className="w-full justify-start text-left font-normal"
          >
            {date ? (
              format(date, "EEE, MMM d yyyy • HH:mm")
            ) : (
              <span className="text-muted-foreground">Select date & time</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-3" align="start">
          <div className="flex flex-col gap-3">
            <DayPicker
              mode="single"
              selected={date || undefined}
              onSelect={(d) => {
                if (!d) return;
                if (minDate && d < minDate) return;
                const newDate = new Date(d);
                newDate.setHours(parseInt(hours, 10));
                newDate.setMinutes(parseInt(minutes, 10));
                setDate(newDate);
              }}
              disabled={minDate ? [{ before: minDate }] : undefined}
              showOutsideDays
            />
            <div className="flex items-end gap-2">
              <div className="flex flex-col">
                <Label htmlFor="hours" className="text-xs">
                  Hour
                </Label>
                <Input
                  id="hours"
                  type="number"
                  min={0}
                  max={23}
                  value={hours}
                  onChange={(e) => {
                    let v = e.target.value.slice(0, 2);
                    if (v === "") v = "0";
                    const n = Math.min(23, Math.max(0, parseInt(v, 10)));
                    setHours(String(n).padStart(2, "0"));
                  }}
                  className="w-20"
                />
              </div>
              <div className="flex flex-col">
                <Label htmlFor="minutes" className="text-xs">
                  Min
                </Label>
                <Input
                  id="minutes"
                  type="number"
                  min={0}
                  max={59}
                  value={minutes}
                  onChange={(e) => {
                    let v = e.target.value.slice(0, 2);
                    if (v === "") v = "0";
                    const n = Math.min(59, Math.max(0, parseInt(v, 10)));
                    setMinutes(String(n).padStart(2, "0"));
                  }}
                  className="w-20"
                />
              </div>
              <div className="self-end">
                <Button
                  type="button"
                  onClick={() => setOpen(false)}
                  variant="secondary"
                >
                  Done
                </Button>
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
      {/* Hidden native input for form compatibility if needed */}
      <input
        type="hidden"
        value={date ? date.toISOString() : ""}
        required={required}
      />
    </div>
  );
}
