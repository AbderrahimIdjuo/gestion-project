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

export default function ComboBoxFournisseur({ fournisseur, setFournisseur }) {
  const [openComboBox, setOpenComboBox] = useState(false);
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const { ref, inView } = useInView();
  const [searchQuery, setSearchQuery] = useState("");
  const [buttonWidth, setButtonWidth] = useState(0);
  const buttonRef = useRef(null);
  const { watch, setValue } = useForm({
    defaultValues: { fournisseur },
  });
  useEffect(() => {
    //setValue("fournisseur", fournisseur);
    console.log("fournisseur", fournisseur);
  }, [fournisseur]);
  useEffect(() => {
    if (buttonRef.current) {
      setButtonWidth(buttonRef.current.offsetWidth);
    }
  }, [buttonRef.current, openComboBox]);

  // infinite scrolling fournisseurs comboBox
  const { data, fetchNextPage, isLoading, isFetchingNextPage, hasNextPage } =
    useInfiniteQuery({
      queryKey: ["fournisseurs", debouncedQuery],
      queryFn: async ({ pageParam = null }) => {
        const response = await axios.get(
          "/api/fournisseurs/infinitPagination",
          {
            params: {
              limit: 10,
              query: debouncedQuery,
              cursor: pageParam,
            },
          }
        );
        return response.data;
      },
      getNextPageParam: (lastPage) => lastPage.nextCursor || null,
      keepPreviousData: true,
    });

  const fournisseurs = data?.pages.flatMap((page) => page.fournisseurs) || [];

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
      <Label className="text-sm font-medium block pt-1">Fournisseur :</Label>
      <Popover open={openComboBox} onOpenChange={setOpenComboBox}>
        <PopoverTrigger asChild>
          <Button
            ref={buttonRef}
            variant="outline"
            role="combobox"
            aria-expanded={openComboBox}
            className="w-full justify-between mt-2"
          >
            {watch("fournisseur")
              ? watch("fournisseur").nom.toUpperCase()
              : "Sélectionner ..."}
            <ChevronDown className="opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          style={{ width: buttonWidth }}
          className="p-0"
          onWheel={(e) => {
            // Empêcher la propagation vers le dialog parent
            e.stopPropagation();
          }}
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
              ) : fournisseurs.length === 0 ? (
                <CommandEmpty>
                  <span>Aucun fournisseur trouvé.</span>
                </CommandEmpty>
              ) : (
                <>
                  <ScrollArea
                    className="h-72 w-full"
                    onWheel={(e) => {
                      // Permettre le scroll dans cette zone
                      e.stopPropagation();
                    }}
                  >
                    <CommandGroup>
                      {fournisseurs.map((fournisseur, index) => (
                        <CommandItem
                          name="fournisseur"
                          key={index}
                          value={fournisseur.nom}
                          onSelect={() => {
                            setOpenComboBox(false);
                            setValue("fournisseur", fournisseur);
                            setFournisseur(fournisseur);
                            console.log("Selected fournisseur :", fournisseur);
                          }}
                        >
                          {fournisseur.nom.toUpperCase()}
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
