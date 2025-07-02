"use client";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { ChevronRight , MoveRight } from "lucide-react";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

function CustomDateRangePicker({
  startDate,
  setStartDate,
  endDate,
  setEndDate,
}) {
  // Fonction pour convertir en UTC à minuit
  const toUTCDateOnly = (localDate) => {
    return new Date(
      Date.UTC(
        localDate.getFullYear(),
        localDate.getMonth(),
        localDate.getDate()
      )
    );
  };

  // Handler pour la date de début
  const handleStartDateSelect = (selectedDate) => {
    if (selectedDate && setStartDate) {
      const fixedDate = toUTCDateOnly(selectedDate);
      setStartDate(fixedDate.toISOString());
    }
  };

  // Handler pour la date de fin
  const handleEndDateSelect = (selectedDate) => {
    if (selectedDate && setEndDate) {
      const fixedDate = toUTCDateOnly(selectedDate);
      setEndDate(fixedDate.toISOString());
    }
  };

  return (
    <div className="flex gap-2 justify-center items-center">
      {/* date début */}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant={"outline"}
            className={cn(
              "col-span-3 w-full justify-start text-left font-normal hover:text-purple-600 hover:bg-white hover:border-2 hover:border-purple-500",
              !startDate && "text-muted-foreground"
            )}
          >
            <CalendarIcon />
            {startDate ? format(new Date(startDate), "dd-MM-yyyy") : <span>début</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0">
          <Calendar
            mode="single"
            selected={startDate ? new Date(startDate) : undefined}
            onSelect={handleStartDateSelect}
            initialFocus
          />
        </PopoverContent>
      </Popover>
      <ChevronRight className="h-10 w-10 text-purple-600 font-bold" />
      {/* date fin */}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant={"outline"}
            className={cn(
              "col-span-3 w-full justify-start text-left font-normal hover:text-purple-600 hover:bg-white hover:border-2 hover:border-purple-500",
              !endDate && "text-muted-foreground"
            )}
          >
            <CalendarIcon />
            {endDate ? format(new Date(endDate), "dd-MM-yyyy") : <span>fin</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0">
          <Calendar
            mode="single"
            selected={endDate ? new Date(endDate) : undefined}
            onSelect={handleEndDateSelect}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}

export default CustomDateRangePicker;