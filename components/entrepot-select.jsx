"use client";

import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

export function EntrepotSelect({
  value,
  onValueChange,
  placeholder = "Sélectionner un entrepôt…",
  className,
  label = "Entrepôt",
  showLabel = true,
  disabled = false,
  allowEmpty = false,
  emptyLabel = "Tous les entrepôts",
}) {
  const query = useQuery({
    queryKey: ["entrepots"],
    queryFn: async () => {
      const response = await axios.get("/api/entrepots");
      return response.data.entrepots || [];
    },
  });

  return (
    <div className="w-full space-y-2">
      {showLabel && (
        <Label className="text-sm font-medium block pt-1">{label}</Label>
      )}
      <Select
        value={value || undefined}
        onValueChange={onValueChange}
        disabled={disabled || query.isLoading}
      >
        <SelectTrigger
          className={className || "w-full bg-white focus:ring-purple-500"}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {allowEmpty && (
            <SelectItem value="all">{emptyLabel}</SelectItem>
          )}
          {query.data?.map(entrepot => (
            <SelectItem key={entrepot.id} value={entrepot.id}>
              {entrepot.nom}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
