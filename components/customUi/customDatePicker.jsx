"use client";

import * as React from "react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export function CustomDatePicker({
  date,
  onDateChange,
  placeholder = "Pick a date",
  buttonClassName,
}) {
  // Handle date changes internally and pass them to the `onDateChange` prop
  const handleDateSelect = (selectedDate) => {
    if (onDateChange) {
      onDateChange(selectedDate); // Call the parent-provided handler
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-[280px] justify-start text-left font-normal",
            !date && "text-muted-foreground",
            buttonClassName // Allow custom button styles
          )}
        >
          <CalendarIcon className="mr-2" />
          {date ? format(date, "PPP") : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <Calendar
          mode="single"
          selected={date}
          onSelect={handleDateSelect} // Pass the internal handler
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}
