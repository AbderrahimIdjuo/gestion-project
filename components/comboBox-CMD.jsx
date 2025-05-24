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

export default function ComboBoxCommandes({ onSelect }) {
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
      queryKey: ["commandes", debouncedQuery],
      queryFn: async ({ pageParam = null }) => {
        const response = await axios.get("/api/commandes/cmdList", {
          params: {
            limit: 10,
            query: debouncedQuery,
            cursor: pageParam,
          },
        });
        console.log("commandes", response.data);
        return response.data;
      },
      getNextPageParam: (lastPage) => lastPage.nextCursor || null,
      keepPreviousData: true,
    });

  const commandes = data?.pages.flatMap((page) => page.commandes) || [];

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
      <Label className="text-sm font-medium block">Commande numero :</Label>
      <Popover open={openComboBox} onOpenChange={setOpenComboBox}>
        <PopoverTrigger asChild>
          <Button
            ref={buttonRef}
            variant="outline"
            role="combobox"
            aria-expanded={openComboBox}
            className="w-full justify-between mt-2"
          >
            {watch("commande") ? watch("commande").numero : "Sélectionner ..."}
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
              ) : commandes.length === 0 ? (
                <CommandEmpty>
                  <span>Aucune commande trouvé.</span>
                </CommandEmpty>
              ) : (
                <>
                  <ScrollArea className="h-72 w-full">
                    <CommandGroup>
                      {commandes.map((commande, index) => (
                        <CommandItem
                          name="commande"
                          key={index}
                          value={commande.nom}
                          onSelect={() => {
                            setOpenComboBox(false);
                            setValue("commande", commande);
                            onSelect(commande);
                          }}
                        >
                          <div className="flex justify-between w-full">
                            <div>{commande.numero}</div>
                            <div>{commande.client.nom} </div>
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
