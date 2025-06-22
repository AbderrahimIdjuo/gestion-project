"use client";

import * as React from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { fr } from "date-fns/locale";
export function CustomDatePicker({ date, onDateChange }) {
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
          variant={"outline"}
          className={cn(
            "w-full justify-start text-left font-normal hover:text-purple-600 hover:bg-white hover:border-2 hover:border-purple-500",
            !date && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="mr-2" />
          {date ? (
            format(new Date(date), "PPP", {
              locale: fr,
            })
          ) : (
            <span>Choisis une date</span>
          )}
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
