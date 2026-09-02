"use client";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";

function ChargeTypeChip({ type }) {
  const isVariante = type === "variante";
  return (
    <span
      title={isVariante ? "Charge variante" : "Charge fixe"}
      className={`shrink-0 text-xs font-bold px-1.5 py-0.5 rounded ${
        isVariante
          ? "bg-sky-100 text-sky-700"
          : "bg-amber-100 text-amber-700"
      }`}
    >
      {isVariante ? "V" : "F"}
    </span>
  );
}

export default function ComboBoxCharges({
  value,
  onValueChange,
  label = "Label",
  placeholder = "Sélectionner...",
}) {
  const [open, setOpen] = useState(false);
  const [buttonWidth, setButtonWidth] = useState(0);
  const buttonRef = useRef(null);

  const charges = useQuery({
    queryKey: ["charges"],
    queryFn: async () => {
      const response = await axios.get("/api/charges");
      return response.data.charges;
    },
  });

  useEffect(() => {
    if (buttonRef.current) {
      setButtonWidth(buttonRef.current.offsetWidth);
    }
  }, [open]);

  const selected = charges.data?.find(c => c.charge === value);

  return (
    <div className="w-full space-y-2">
      {label ? (
        <Label className="text-sm font-medium block">{label}</Label>
      ) : null}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            ref={buttonRef}
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between bg-white focus:ring-purple-500"
          >
            {value ? (
              <span className="flex items-center gap-2 truncate">
                <span className="truncate">{value}</span>
                <ChargeTypeChip type={selected?.type || "fixe"} />
              </span>
            ) : (
              <span className="text-muted-foreground font-normal">
                {placeholder}
              </span>
            )}
            <ChevronDown className="opacity-50 shrink-0" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          style={{ width: buttonWidth || undefined }}
          className="p-0"
          align="start"
          onWheel={e => {
            e.stopPropagation();
          }}
        >
          <Command>
            <CommandInput placeholder="Chercher..." className="h-9" />
            <CommandList>
              {charges.isLoading ? (
                <div className="flex justify-center p-2">
                  <span className="px-5 pb-5 text-gray-400 text-sm text-center">
                    Chargement...
                  </span>
                </div>
              ) : (
                <>
                  <CommandEmpty>Aucune charge trouvée.</CommandEmpty>
                  <ScrollArea
                    className="h-72 w-full"
                    onWheel={e => {
                      e.stopPropagation();
                    }}
                  >
                    <CommandGroup>
                      {(charges.data || []).map(element => (
                        <CommandItem
                          key={element.id}
                          value={element.charge}
                          onSelect={() => {
                            onValueChange?.(element.charge);
                            setOpen(false);
                          }}
                          className="flex items-center justify-between gap-2"
                        >
                          <span>{element.charge}</span>
                          <ChargeTypeChip type={element.type} />
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </ScrollArea>
                </>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
