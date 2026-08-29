"use client";

import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { entrepotBadgeClass } from "@/lib/entrepot-badge";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";

export function warehouseQty(item, entrepotId) {
  if (!entrepotId) return 0;
  const row = item?.stocksEntrepot?.find(s => s.entrepotId === entrepotId);
  return row?.quantite ?? 0;
}

export function defaultEntrepotIdFromStocks(stocksEntrepot) {
  const withStock = (stocksEntrepot || []).filter(
    s => Number(s.quantite) > 0
  );
  if (withStock.length === 1) return withStock[0].entrepotId;
  return "";
}

function formatQty(qty) {
  return Number(qty).toLocaleString("fr-FR", { maximumFractionDigits: 2 });
}

function EntrepotChip({ entrepotId, children, className }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "rounded-full font-normal border shrink-0",
        entrepotBadgeClass(entrepotId),
        className
      )}
    >
      {children}
    </Badge>
  );
}

export function BlLigneEntrepotSelect({ item, onEntrepotChange }) {
  const query = useQuery({
    queryKey: ["entrepots"],
    queryFn: async () => {
      const response = await axios.get("/api/entrepots");
      return response.data.entrepots || [];
    },
  });

  const selectedId = item.entrepotId || "";
  const selected = query.data?.find(e => e.id === selectedId);
  const selectedQty = warehouseQty(item, selectedId);

  return (
    <div className="min-w-[210px]">
      <Select
        value={selectedId || undefined}
        onValueChange={onEntrepotChange}
        disabled={query.isLoading}
      >
        <SelectTrigger className="h-10 w-full bg-white focus:ring-purple-500 [&>span]:line-clamp-none [&>span]:flex [&>span]:min-w-0 [&>span]:flex-1 [&>span]:items-center [&>span]:gap-1.5">
          {selected ? (
            <span className="flex min-w-0 flex-1 items-center gap-1.5">
              <span className="truncate">{selected.nom}</span>
              <EntrepotChip entrepotId={selected.id}>
                {formatQty(selectedQty)}
              </EntrepotChip>
            </span>
          ) : (
            <span className="text-muted-foreground">Entrepôt…</span>
          )}
        </SelectTrigger>
        <SelectContent>
          {query.data?.map(entrepot => {
            const qty = warehouseQty(item, entrepot.id);
            return (
              <SelectItem key={entrepot.id} value={entrepot.id}>
                <span className="flex items-center gap-1.5">
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-normal",
                      entrepotBadgeClass(entrepot.id)
                    )}
                  >
                    {entrepot.nom}
                  </span>
                  <span className="text-xs tabular-nums text-muted-foreground">
                    {formatQty(qty)}
                  </span>
                </span>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
    </div>
  );
}
