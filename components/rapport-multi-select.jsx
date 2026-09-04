"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ChevronDown, Loader2, Search } from "lucide-react";
import { useMemo, useState } from "react";

export function RapportMultiSelect({
  label,
  items,
  selectedIds,
  onChange,
  allLabel,
  placeholder,
  idKey = "id",
  nameKey,
  getLabel,
  searchable = false,
  isLoading = false,
}) {
  const [search, setSearch] = useState("");

  const getName = item => (getLabel ? getLabel(item) : item[nameKey]);

  const allIds = items.map(item => item[idKey]);
  const allSelected =
    allIds.length > 0 && allIds.every(id => selectedIds.includes(id));

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!searchable || !q) return items;
    return items.filter(item => getName(item).toLowerCase().includes(q));
  }, [items, search, searchable, getLabel, nameKey]);

  const toggleAll = checked => {
    onChange(checked ? allIds : []);
  };

  const toggleOne = (id, checked) => {
    if (checked) {
      onChange([...new Set([...selectedIds, id])]);
    } else {
      onChange(selectedIds.filter(selected => selected !== id));
    }
  };

  const selectedNames = items
    .filter(item => selectedIds.includes(item[idKey]))
    .map(item => getName(item));

  return (
    <div className="flex flex-col gap-2">
      <Label className="text-sm font-medium leading-none">{label}</Label>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            disabled={isLoading}
            className="w-full justify-between text-left font-normal focus:ring-2 focus:ring-purple-500 bg-white h-10 min-h-10 py-0"
          >
            <div className="flex flex-wrap gap-1">
              {isLoading ? (
                <span className="inline-flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Chargement...
                </span>
              ) : selectedIds.length === 0 ? (
                <span className="text-muted-foreground">{placeholder}</span>
              ) : allSelected ? (
                <Badge
                  variant="secondary"
                  className="text-xs bg-purple-100 text-purple-800 hover:bg-purple-200"
                >
                  {allLabel}
                </Badge>
              ) : (
                selectedNames.slice(0, 3).map(name => (
                  <Badge
                    key={name}
                    variant="secondary"
                    className="text-xs bg-purple-100 text-purple-800 hover:bg-purple-200"
                  >
                    {name}
                  </Badge>
                ))
              )}
              {!allSelected && selectedNames.length > 3 && (
                <Badge variant="secondary" className="text-xs">
                  +{selectedNames.length - 3}
                </Badge>
              )}
            </div>
            <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-[var(--radix-popover-trigger-width)] p-3"
          align="start"
        >
          <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
            {searchable && (
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Rechercher..."
                  className="h-8 pl-8 text-sm"
                />
              </div>
            )}
            <div className="flex items-center space-x-2 pb-2 border-b">
              <Checkbox
                id={`${label}-all`}
                checked={allSelected}
                onCheckedChange={checked => toggleAll(!!checked)}
              />
              <Label
                htmlFor={`${label}-all`}
                className="text-sm font-semibold cursor-pointer"
              >
                {allLabel}
              </Label>
            </div>
            {filteredItems.length === 0 ? (
              <p className="text-sm text-muted-foreground py-2">
                Aucun résultat
              </p>
            ) : (
              filteredItems.map(item => {
                const id = item[idKey];
                const name = getName(item);
                const checkboxId = `${label}-${id}`;
                return (
                  <div key={id} className="flex items-center space-x-2">
                    <Checkbox
                      id={checkboxId}
                      checked={selectedIds.includes(id)}
                      onCheckedChange={checked => toggleOne(id, !!checked)}
                    />
                    <Label
                      htmlFor={checkboxId}
                      className="text-sm font-medium cursor-pointer"
                    >
                      {name}
                    </Label>
                  </div>
                );
              })
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

export function produitRapportLabel(produit) {
  if (!produit) return "—";
  const ref = produit.reference ? ` (${produit.reference})` : "";
  return `${produit.designation}${ref}`;
}
