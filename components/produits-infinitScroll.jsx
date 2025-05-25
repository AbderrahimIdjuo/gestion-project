"use client";

import { useState, useEffect, useRef } from "react";
import { ChevronDown, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoadingDots } from "@/components/loading-dots";

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
import { Badge } from "@/components/ui/badge";

import { useInView } from "react-intersection-observer";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import axios from "axios";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export default function ProduitsInfinitScroll() {
  const [openComboBox, setOpenComboBox] = useState(false);
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const { ref, inView } = useInView();
  const [searchQuery, setSearchQuery] = useState("");
  const [buttonWidth, setButtonWidth] = useState(0);
  const buttonRef = useRef(null);
  const { watch, setValue } = useForm();
  const [filters, setFilters] = useState({
    categorie: "all",
  });
  useEffect(() => {
    if (buttonRef.current) {
      setButtonWidth(buttonRef.current.offsetWidth);
    }
  }, [buttonRef.current, openComboBox]);

  // infinite scrolling fournisseurs comboBox
  // const { data, fetchNextPage, isLoading, isFetchingNextPage, hasNextPage } =
  //   useInfiniteQuery({
  //     queryKey: ["fournisseurs", debouncedQuery],
  //     queryFn: async ({ pageParam = null }) => {
  //       const response = await axios.get(
  //         "/api/fournisseurs/infinitPagination",
  //         {
  //           params: {
  //             limit: 10,
  //             query: debouncedQuery,
  //             cursor: pageParam,
  //           },
  //         }
  //       );
  //       return response.data;
  //     },
  //     getNextPageParam: (lastPage) => lastPage.nextCursor || null,
  //     keepPreviousData: true,
  //   });

  // const fournisseurs = data?.pages.flatMap((page) => page.fournisseurs) || [];

  // useEffect(() => {
  //   if (inView && hasNextPage) {
  //     fetchNextPage();
  //   }
  // }, [inView, hasNextPage, fetchNextPage]);

  // useEffect(() => {
  //   const handler = setTimeout(() => {
  //     setDebouncedQuery(searchQuery);
  //   }, 500);

  //   return () => clearTimeout(handler);
  // }, [searchQuery]);
  const categories = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const response = await axios.get("/api/categoriesProduits");
      return response.data.categories;
    },
  });
  // infinite scrolling produits comboBox
  const {
    data,
    fetchNextPage,
    isLoading,
    isFetchingNextPage,
    isFetching,
    hasNextPage,
  } = useInfiniteQuery({
    queryKey: ["produits", debouncedQuery, filters.categorie],
    queryFn: async ({ pageParam = null }) => {
      const response = await axios.get("/api/produits/infinitPagination", {
        params: {
          limit: 10,
          query: debouncedQuery,
          cursor: pageParam,
          categorie: filters.categorie,
        },
      });
      return response.data;
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor || null,
    keepPreviousData: true,
  });

  const produits = data?.pages.flatMap((page) => page.produits) || [];

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
    <div className="w-full h-full">
      <div name="selectCategorie" className=" relative px-4 pt-2 pb-1">
        <Select
          value={filters.categorie}
          onValueChange={(value) =>
            setFilters({ ...filters, categorie: value })
          }
        >
          <SelectTrigger className="col-span-3  bg-white focus:ring-purple-500">
            <SelectValue placeholder="Séléctionnez une catégorie..." />
          </SelectTrigger>
          <SelectContent className="bg-white">
            <SelectItem key="all" value="all">
              Toutes les catégories
            </SelectItem>
            {categories.data?.map((element) => (
              <SelectItem key={element.id} value={element.categorie}>
                {element.categorie}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="relative  px-4 py-1">
        <Search className="absolute left-6 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Chercher un produit..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 w-full text-left rounded-lg focus:!ring-purple-500"
        />
        <div className="absolute mt-1 right-10 top-1/3 h-4 w-4 -translate-y-1/2 text-muted-foreground">
          {isFetching && !isLoading && <LoadingDots />}
        </div>
      </div>
      <div className="h-[500px] space-y-2">
        <ScrollArea className="h-[100%] w-full">
          {produits?.length > 0 ? (
            produits?.map((article, index) => (
              <div
                key={index}
                className={cn(
                  "flex items-center justify-between p-3 my-1 rounded-lg cursor-pointer transition-colors w-full",
                  selectedArticles[article.id]
                    ? "bg-purple-50 text-violet-700"
                    : "hover:bg-gray-50"
                )}
                onClick={() => handleToggleArticle(article)}
              >
                <div className="space-y-1">
                  <p className="text-md font-medium">{article.designation}</p>
                  <p className="text-xs text-muted-foreground">
                    Prix d&apos;unité: {article.prixAchat.toFixed(2)} MAD
                  </p>
                </div>
                <div
                  className={cn(
                    "h-5 w-5 rounded-full hover:bg-green-500 border flex items-center justify-center transition-colors",
                    selectedArticles[article.id]
                      ? "bg-green-500 "
                      : "hover:bg-gray-50"
                  )}
                >
                  {selectedArticles[article.id] && (
                    <Check className="h-3 w-3  text-purple-100" />
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="flex justify-center mt-5">
              <LoadingDots size={8} />
            </div>
          )}
          <div
            key="observer"
            ref={ref}
            className="flex justify-center p-2"
          ></div>
        </ScrollArea>
      </div>
    </div>
  );
}
