"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { customAlphabet } from "nanoid";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Trash2, MoveLeftIcon } from "lucide-react";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChevronDown } from "lucide-react";
import { ArticleSelectionDialog } from "@/components/articls-selection-dialog";

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { AddButton } from "@/components/customUi/styledButton";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CircleX } from "lucide-react";
import newDeviSchema from "@/app/zodSchemas/newDeviSchema";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useInView } from "react-intersection-observer";

export default function NouveauDevisPage() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const scrollAreaRef = useRef(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [isArticleDialogOpen, setIsArticleDialogOpen] = useState(false);
  const [formError, setFormError] = useState(false);

  const { ref, inView } = useInView();
  const {
    register,
    reset,
    watch,
    setValue,
    handleSubmit,
    formState: { errors, isSubmiting },
  } = useForm({
    defaultValues: {
      client: null,
      statut: "En attente",
      reduction: 0,
      typeReduction: "%",
      unite: "U",
      articls: [],
    },
    resolver: zodResolver(newDeviSchema),
  });

  const status = [
    { lable: "En attente", color: "amber-500" },
    { lable: "Accepté", color: "green-500" },
    { lable: "Annulé", color: "red-500" },
  ];

  const generateDeviNumber = () => {
    const digits = "1234567890";
    const nanoidCustom = customAlphabet(digits, 8);
    const customId = nanoidCustom();
    return `DEV-${customId}`;
  };

  const onSubmit = async (data) => {
    console.log("data######", data);

    toast.promise(
      (async () => {
        try {
          const response = await axios.post("/api/devis", data);
          console.log("Devi ajouté avec succès");
          reset();
          setItems([]);
          setFormError(false);
          if (response.status === 200) {
            console.log("Devi ajouté avec succès");
          } else {
            throw new Error("Unexpected response status");
          }
        } catch (error) {
          console.log(error);
        }
      })(),
      {
        loading: "Ajout du devi ...",
        success: "Devi ajouté avec succès!",
        error: "Échec de l'ajout du devi",
      }
    );
  };
  const onError = (errors) => {
    console.log("Erreur de validation:", errors);
    setFormError(true); // Si le formulaire échoue
  };
  const handleItemChange = (id, field, value) => {
    setItems((prevItems) =>
      prevItems.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  };
  const handleAddArticles = (newArticles) => {
    setItems((prevItems) => [
      ...prevItems,
      ...newArticles.map((article) => ({
        ...article,
      })),
    ]);
    console.log("newArticles", newArticles);
    console.log("items ", items);
  };
  const removeItem = (deletedItem) => {
    console.log("deletedItem", deletedItem);
    console.log("items", items);
    setItems((prev) => prev.filter((item) => item.key !== deletedItem.key));
  };
  const calculateSubTotal = () => {
    const subtotal =  items.reduce((sum, item) => {
      const amount = item.quantite * item.prixUnite;
      return sum + amount;
    }, 0);
        const discountAmount =
      watch("typeReduction") === "%"
        ? subtotal * (watch("reduction") / 100)
        : Number(watch("reduction"));
return subtotal - discountAmount;
  };

   const calculateTVA = () => {
    return calculateSubTotal() * 0.2;;
  };
  const calculateTotal = () => {
    return (calculateSubTotal() + calculateTVA()).toFixed(2);
  };


  // infinite scrolling clients comboBox
  const { data, fetchNextPage, isLoading, isFetchingNextPage, hasNextPage } =
    useInfiniteQuery({
      queryKey: ["clients", debouncedQuery],
      queryFn: async ({ pageParam = null }) => {
        const response = await axios.get("/api/commandes/nouveau", {
          params: {
            limit: 15,
            query: debouncedQuery,
            cursor: pageParam,
          },
        });
        return response.data;
      },
      getNextPageParam: (lastPage) => lastPage.nextCursor || null,
      keepPreviousData: true,
    });

  const clients = data?.pages.flatMap((page) => page.clients) || [];

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

  const unites = ["U", "m²", "m"];

  const validateFloat = (value) => {
    if (typeof value === "string") {
      value = value.replace(",", ".");
      // Remove any whitespace that might interfere
      value = value.trim();
    }
   // const number = parseFloat(value);
    const parsed = parseFloat(value);
    if (isNaN(parsed)) {
      // throw new Error("The value must be a float.");
      return false;
    }
    return parsed;
  };

  return (
    <>
      <Toaster position="top-center" />
      <form className="m-0 p-0" onSubmit={handleSubmit(onSubmit, onError)}>
        <div className="container mb-10 mx-auto py-6 space-y-6 w-full">
          <div className="flex gap-3 items-center ">
              <h1 className="text-3xl font-bold">Nouveau devis</h1>
            </div>
          <Card className="w-full">
            <CardContent className="p-6 space-y-6">
              {/* Header Section */}
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="col-span-2">
                    <Label htmlFor="customerName">Client*</Label>
                    <br />
                    <Popover open={open} onOpenChange={setOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={open}
                          className="w-full justify-between mt-2"
                        >
                          {watch("client")
                            ? watch("client").nom.toUpperCase()
                            : "Sélectionner..."}
                          <ChevronDown className="opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto min-w-[25vw] p-0">
                        <Command>
                          <CommandInput
                            placeholder="Chercher un client..."
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
                            ) : clients.length === 0 ? (
                              <CommandEmpty>
                                <span>Aucun client trouvé.</span>
                              </CommandEmpty>
                            ) : (
                              <>
                                <ScrollArea
                                  className="h-72 w-full"
                                  ref={scrollAreaRef}
                                >
                                  <CommandGroup>
                                    {clients.map((client) => (
                                      <CommandItem
                                        name="client"
                                        key={client.id}
                                        value={client.nom}
                                        onSelect={() => {
                                          setOpen(false);
                                          setValue("client", client);
                                          setValue("clientId", client.id);
                                          generateDeviNumber();
                                        }}
                                      >
                                        {client.nom.toUpperCase()}
                                      </CommandItem>
                                    ))}
                                    <div
                                      ref={ref}
                                      className="flex justify-center p-2"
                                    ></div>
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
                  {errors.clientId && (
                    <p className="text-red-500 text-sm mt-1 flex gap-1 items-center">
                      <CircleX className="h-4 w-4" />
                      {errors.clientId.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="statut" className="text-right text-black">
                    Statut
                  </Label>
                  <Select
                    value={watch("statut")}
                    name="statut"
                    onValueChange={(value) => setValue("statut", value)}
                  >
                    <SelectTrigger className="col-span-3 bg-white focus:ring-purple-500">
                      <SelectValue placeholder="Tous les statuts" />
                    </SelectTrigger>
                    <SelectContent>
                      {status.map((statut, index) => (
                        <SelectItem key={index} value={statut.lable}>
                          <div className="flex items-center gap-2">
                            <span
                              className={`h-2 w-2 rounded-full bg-${statut.color}`}
                            />
                            {statut.lable}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Items Table */}
              <div className="space-y-4">
                {items.length > 0 && (
                  <>
                    <div className="overflow-hidden border rounded-lg">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[30%]">Articls</TableHead>
                            <TableHead className="w-[10%] text-center">
                              Longueur
                            </TableHead>
                            <TableHead className="w-[10%] text-center">
                              Largeur
                            </TableHead>
                            <TableHead className="w-[10%] text-center">
                              Unité
                            </TableHead>
                            <TableHead>Quantité</TableHead>
                            <TableHead>Prix d&apos;unité</TableHead>
                            <TableHead colSpan={2} className="text-left">
                              Montant
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {items.map((item, index) => (
                            <TableRow key={item.key}>
                              <TableCell>
                                <span className="focus:!ring-purple-500 text-md font-semibold ">
                                  {item.designation}
                                </span>
                              </TableCell>
                              <TableCell>
                                <Input
                                  onChange={(e) =>{
                                      handleItemChange(
                                      item.id,
                                      "length",
                                      validateFloat(e.target.value)
                                    )                                   
                                    
                                  }
                                  
                                  }
                                  className={`focus:!ring-purple-500 w-24 ${
                                    errors.articls?.[index]?.length &&
                                    "!border-red-500"
                                  }`}
                                />
                                {errors.articls?.[index]?.length && (
                                  <p className="text-xs text-red-500 mt-1">
                                    {errors.articls[index].length.message}
                                  </p>
                                )}
                              </TableCell>
                              <TableCell>
                                <Input
                                  onChange={(e) =>
                                    handleItemChange(
                                      item.id,
                                      "width",
                                      validateFloat(e.target.value)
                                    )
                                  }
                                  className={`focus:!ring-purple-500 w-24 ${
                                    errors.articls?.[index]?.width &&
                                    "!border-red-500"
                                  }`}
                                />
                                {errors.articls?.[index]?.width && (
                                  <p className="text-xs text-red-500 mt-1">
                                    {errors.articls[index].width.message}
                                  </p>
                                )}
                              </TableCell>
                              <TableCell>
                                <Select
                                  defaultValue="U"
                                  name="unites"
                                  onValueChange={(value) =>
                                    handleItemChange(item.id, "unite", value)
                                  }
                                >
                                  <SelectTrigger className="col-span-3 bg-white focus:ring-purple-500">
                                    <SelectValue placeholder="Séléctionner un statut" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {unites.map((unite) => (
                                      <SelectItem key={unite} value={unite}>
                                        {unite}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </TableCell>
                              <TableCell>
                                <Input
                                  type="number"
                                  min={1}
                                  value={item.quantite}
                                  onChange={(e) =>
                                    handleItemChange(
                                      item.id,
                                      "quantite",
                                      Number(e.target.value)
                                    )
                                  }
                                  className="focus:!ring-purple-500 w-20"
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  onChange={(e) => {
                                    handleItemChange(
                                      item.id,
                                      "prixUnite",
                                      validateFloat(e.target.value)
                                    );
                                  }}
                                  className={`focus:!ring-purple-500 w-24 ${
                                    errors.articls?.[index]?.prixUnite &&
                                    "!border-red-500"
                                  }`}
                                />
                                {errors.articls?.[index]?.prixUnite && (
                                  <p className="text-xs text-red-500 mt-1">
                                    {errors.articls[index].prixUnite.message}
                                  </p>
                                )}
                              </TableCell>
                              <TableCell>
                                {!isNaN(item.quantite * item.prixUnite)
                                  ? (item.quantite * item.prixUnite).toFixed(2)
                                  : 0}
                              </TableCell>
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => removeItem(item)}
                                  className="h-8 w-8 rounded-full hover:bg-red-100 hover:text-red-600"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </>
                )}

                <AddButton
                  type="button"
                  onClick={() => setIsArticleDialogOpen(true)}
                  title="Ajouter des articls"
                />
                {errors.articls && (
                  <p className="text-red-500 text-sm mt-1 flex gap-1 items-center">
                    <CircleX className="h-4 w-4" />
                    {errors.articls.message
                      ? errors.articls.message
                      : "Veuillez corriger les erreurs dans le formulaire."}
                  </p>
                )}
                <ArticleSelectionDialog
                  open={isArticleDialogOpen}
                  onOpenChange={setIsArticleDialogOpen}
                  onArticlesAdd={handleAddArticles}
                />
              </div>
              <div className="grid gap-6 w-full p-5">
                <Label htmlFor="noteClient" className="text-left text-black">
                  Note de client
                </Label>
                <Textarea
                  name="note"
                  {...register("note")}
                  className="col-span-3 focus-visible:ring-purple-300 focus-visible:ring-purple-500"
                />
              </div>

              {/* Totals Section */}
              <div className="space-y-4 bg-purple-50 p-4 rounded-lg">
                <div className="space-y-4">
                  <div className="flex justify-between py-2 border-b">
                    <span>Total H.T</span>
                    <span>{calculateSubTotal().toFixed(2)} MAD</span>
                  </div>
                  <div className="flex justify-between py-2 ">
                    <span>TVA 20%</span>
                    <span>{calculateTVA().toFixed(2)} MAD</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="discount">Réduction</Label>
                      <div className="flex items-center">
                        <div className="relative flex items-center">
                          <Input
                            id="reduction"
                            name="reduction"
                            {...register("reduction")}
                            className="w-40 pr-[70px] focus:!ring-purple-500"
                          />
                          <Select
                            value={watch("typeReduction")}
                            onValueChange={(value) =>
                              setValue("typeReduction", value)
                            }
                          >
                            <SelectTrigger className="absolute right-0 w-[80px] rounded-l-none border-l-0 focus:ring-1 focus:!ring-purple-500">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="%">%</SelectItem>
                              <SelectItem value="DH">MAD</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between py-2 border-t font-bold">
                    <span>Total TTC</span>
                    <span>{calculateTotal()} MAD</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          <div className="flex justify-end items-center gap-4">
            {formError && (
              <div className="text-red-500 text-sm mt-4 text-center">
                Veuillez corriger les erreurs dans le formulaire.
              </div>
            )}
            <div className="space-x-2">
              <Link href="/ventes/devis">
                <Button
                  type="button"
                  className="rounded-full"
                  variant="outline"
                >
                  Annuler
                </Button>
              </Link>
              <Button
                onClick={() => {
                  setValue("numero", generateDeviNumber());

                  setValue(
                    "sousTotal",
                    parseFloat(calculateSubTotal().toFixed(2))
                  );
                  setValue(
                    "tva",
                    parseFloat(calculateSubTotal() * 0.2).toFixed(2)
                  );
                  setValue("total", parseFloat(calculateTotal()));
                  setValue("articls", items);
                  console.log(
                    "form data validation :",
                    newDeviSchema.parse(watch())
                  );
                  console.log("data details:", watch());
                }}
                type="submit"
                className="bg-gradient-to-r from-fuchsia-500 via-purple-500 to-violet-500 hover:bg-purple-600 hover:scale-105 text-white hover:!text-white font-semibold transition-all duration-300 transform rounded-full"
                disabled={isSubmiting}
              >
                Enregistrer
              </Button>
            </div>
          </div>
        </div>
      </form>
    </>
  );
}
