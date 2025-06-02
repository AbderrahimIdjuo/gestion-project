"use client";

import { useState, useEffect, useRef } from "react";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { useInView } from "react-intersection-observer";
import { useInfiniteQuery } from "@tanstack/react-query";
import axios from "axios";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";

export default function ComboBoxDevis({ onSelect }) {
  const [openComboBox, setOpenComboBox] = useState(false);
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const { ref, inView } = useInView();
  const [searchQuery, setSearchQuery] = useState("");
  const [buttonWidth, setButtonWidth] = useState(0);
  const buttonRef = useRef(null);
  const { watch, setValue } = useForm();

  useEffect(() => {
    if (buttonRef.current) {
      setButtonWidth(buttonRef.current.offsetWidth);
    }
  }, [buttonRef.current, openComboBox]);

  // infinite scrolling fournisseurs comboBox
  const { data, fetchNextPage, isLoading, isFetchingNextPage, hasNextPage } =
    useInfiniteQuery({
      queryKey: ["devis", debouncedQuery],
      queryFn: async ({ pageParam = null }) => {
        const response = await axios.get("/api/devis/devisList", {
          params: {
            limit: 10,
            query: debouncedQuery,
            cursor: pageParam,
          },
        });
        console.log("devis", response.data);
        return response.data;
      },
      getNextPageParam: (lastPage) => lastPage.nextCursor || null,
      keepPreviousData: true,
    });

  const devis = data?.pages.flatMap((page) => page.devis) || [];

  useEffect(() => {
    if (inView && hasNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, fetchNextPage]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 500);

    return () => clearTimeout(handler);
  }, [searchQuery]);

  return (
    <div className="w-full">
      <Label className="text-sm font-medium block">Devis numero :</Label>
      <Popover open={openComboBox} onOpenChange={setOpenComboBox}>
        <PopoverTrigger asChild>
          <Button
            ref={buttonRef}
            variant="outline"
            role="combobox"
            aria-expanded={openComboBox}
            className="w-full justify-between mt-2"
          >
            {watch("devis") ? watch("devis").numero : "Sélectionner ..."}
            <ChevronDown className="opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          onWheel={(e) => {
            // Empêcher la propagation vers le dialog parent
            e.stopPropagation();
          }}
          style={{ width: buttonWidth }}
          className="p-0"
        >
          <Command>
            <CommandInput
              placeholder="Chercher..."
              className="h-9"
              value={searchQuery}
              onValueChange={setSearchQuery}
            />
            <CommandList>
              {isLoading ? (
                <div className="flex justify-center p-2">
                  <span className="px-5 pb-5 text-gray-400 text-sm text-center">
                    Chargement...
                  </span>
                </div>
              ) : devis.length === 0 ? (
                <CommandEmpty>
                  <span>Aucune devis trouvé.</span>
                </CommandEmpty>
              ) : (
                <>
                  <ScrollArea className="h-72 w-full">
                    <CommandGroup>
                      {devis.map((devis, index) => (
                        <CommandItem
                          name="devis"
                          key={index}
                          value={devis.numero}
                          onSelect={() => {
                            setOpenComboBox(false);
                            setValue("devis", devis);
                            onSelect(devis);
                          }}
                        >
                          <div className="flex justify-between w-full">
                            <div>{devis.numero}</div>
                            <div>{devis.client.nom} </div>
                          </div>
                        </CommandItem>
                      ))}
                      <div ref={ref} className="flex justify-center p-2"></div>
                    </CommandGroup>
                    {isFetchingNextPage && (
                      <span className="px-5 pb-5 text-gray-400 text-sm text-center">
                        Chargement...
                      </span>
                    )}
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
