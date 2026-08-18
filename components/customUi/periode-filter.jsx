"use client";

import CustomDateRangePicker from "@/components/customUi/customDateRangePicker";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  PERIODES,
  PERIODES_SANS_TOUTES,
  getDateRangeFromPeriode,
} from "@/lib/periode";
import { useState } from "react";

export function usePeriodeFilter(defaultPeriode = "all") {
  const [periode, setPeriode] = useState(defaultPeriode);
  const [startDate, setStartDate] = useState();
  const [endDate, setEndDate] = useState();
  const { from, to } = getDateRangeFromPeriode(periode, startDate, endDate);

  return {
    periode,
    setPeriode,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    from,
    to,
  };
}

export default function PeriodeFilter({
  periode,
  onPeriodeChange,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  label = "Période :",
  includeToutes = true,
  id = "periode",
}) {
  const options = includeToutes ? PERIODES : PERIODES_SANS_TOUTES;

  return (
    <div className="grid gap-2">
      {label ? (
        <Label htmlFor={id} className="text-left text-black">
          {label}
        </Label>
      ) : null}
      <Select value={periode || undefined} onValueChange={onPeriodeChange}>
        <SelectTrigger
          id={id}
          className="w-full focus:ring-2 focus:ring-purple-500 bg-white"
        >
          <SelectValue placeholder="Sélectionnez la période" />
        </SelectTrigger>
        <SelectContent>
          {options.map(option => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {periode === "personnalisee" && (
        <CustomDateRangePicker
          startDate={startDate}
          setStartDate={setStartDate}
          endDate={endDate}
          setEndDate={setEndDate}
        />
      )}
    </div>
  );
}
