"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AddButton } from "@/components/customUi/styledButton";
import { Textarea } from "@/components/ui/textarea";
import toast, { Toaster } from "react-hot-toast";
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
  TableFooter,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Trash2, MoveLeft, ChevronDown } from "lucide-react";
import { ArticleSelectionDialog } from "@/components/produits-selection-dialog";
import Link from "next/link";
import { ScrollArea } from "@/components/ui/scroll-area";
import axios from "axios";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { customAlphabet } from "nanoid";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { fr } from "date-fns/locale";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { useInView } from "react-intersection-observer";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CircleX } from "lucide-react";
import newCommandeSchema from "@/app/zodSchemas/newCommandeSchema";
import { useQuery, useInfiniteQuery } from "@tanstack/react-query";

export default function NouvelleCommandePage() {
  const [items, setItems] = useState([]);
  const [switchValue, setSwitchValue] = useState(false);
  const [isArticleDialogOpen, setIsArticleDialogOpen] = useState(false);
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [devi, setDevi] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const { ref, inView } = useInView();

  const {
    register,
    reset,
    watch,
    control,
    handleSubmit,
    setValue,
    formState: { errors, isSubmiting },
  } = useForm({
    defaultValues: {
      statut: "En attente",
      fraisLivraison: 0,
      avance: 0,
      reduction: 0,
      typeReduction: "%",
    },
    resolver: zodResolver(newCommandeSchema),
  });

  const selectedDate = watch("echeance");
  useEffect(() => {
    const storedData = localStorage.getItem("devi");
    if (storedData) {
      setDevi(JSON.parse(storedData));
    }
  }, []);
  const statuts = [
    { lable: "En attente", color: "amber-500" },
    { lable: "Accepté", color: "green-500" },
    { lable: "Refusé", color: "red-500" },
  ];

  const devis = useQuery({
    queryKey: ["devisSansCommandes"],
    queryFn: async () => {
      const response = await axios.get("/api/commandes/nouveau");
      const devis = response.data.devis;
      return devis;
    },
  });

  const comptes = useQuery({
    queryKey: ["comptes"],
    queryFn: async () => {
      const response = await axios.get("/api/comptesBancaires");
      const comptes = response.data.comptes;
      return comptes;
    },
  });

  const generateCommandeNumber = () => {
    if (watch("devi")) {
      setValue("numero", `CMD-${watch("devi").numero.slice(4, 13)}`);
    } else {
      const digits = "1234567890";
      const nanoidCustom = customAlphabet(digits, 8);
      const customId = nanoidCustom();
      setValue("numero", `CMD-${customId}`);
    }
  };

  const onSubmit = async (data) => {
    console.log("data", data);

    toast.promise(
      (async () => {
        const response = await fetch("/api/commandes", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        });
        if (!response.ok) {
          throw new Error("Failed to add commande");
        }
        reset();
        setItems([]);
        router.push("/ventes/commandes");
      })(),
      {
        loading: "Ajout du commande ...",
        success: "Commande ajouté avec succès!",
        error: "Échec de l'ajout du commande",
      }
    );
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
  };

  const removeItem = (id) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const calculateSubTotal = () => {
    return items.reduce((sum, item) => {
      const amount = item.quantite * item.prixUnite;
      return sum + amount;
    }, 0);
  };

  const calculateTotal = () => {
    const subtotal = calculateSubTotal();
    const discountAmount =
      watch("typeReduction") === "%"
        ? subtotal * (watch("reduction") / 100)
        : Number(watch("reduction"));
    const total = subtotal - discountAmount + Number(watch("fraisLivraison"));
    return total.toFixed(2);
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

  return (
    <>
      <Toaster position="top-center" />
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="container mx-auto py-6 space-y-6 max-w-5xl mb-10">
          <div className="flex justify-between items-center">
            <div className="flex gap-3 items-center">
              <Link href="/ventes/commandes">
                <Button type="button" size="icon" variant="ghost">
                  <MoveLeft />
                </Button>
              </Link>
              <h1 className="text-3xl font-bold">Nouvelle Commande</h1>
            </div>
          </div>

          <Card>
            <CardContent className="p-6 space-y-6">
              <div className="flex items-center space-x-2">
                <Switch
                  checked={switchValue}
                  onCheckedChange={() => {
                    setSwitchValue(!switchValue);
                    setValue("devi", null);
                    setValue("client", null);
                    if (switchValue) {
                      setValue("statut", "En attente");
                    } else setValue("statut", "Accepté");
                  }}
                  id="airplane-mode"
                />
                <Label htmlFor="airplane-mode">
                  Ajouter la commande par {switchValue ? "client" : "devi"}
                </Label>
              </div>
              <div className="grid grid-cols-4 items-center gap-6">
                {switchValue ? (
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
                                <ScrollArea className="h-72 w-full">
                                  <CommandGroup>
                                    {clients.map((client) => (
                                      <CommandItem
                                        name="client"
                                        key={client.id}
                                        value={client.nom}
                                        onSelect={() => {
                                          setOpen(false);
                                          setValue("client", client);
                                          generateCommandeNumber();
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
                ) : (
                  <div className="col-span-2">
                    <Label htmlFor="Devi number">Numéro de devi*</Label>
                    <br />
                    <Popover open={open} onOpenChange={setOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={open}
                          className="w-full justify-between mt-2"
                        >
                          {watch("devi")
                            ? watch("devi").numero
                            : "Sélectionner..."}
                          <ChevronDown className="opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto min-w-[27vw] p-0">
                        <Command>
                          <CommandInput
                            placeholder="Chercher un devi..."
                            className="h-9"
                          />
                          <CommandList>
                            <CommandEmpty>Aucun devi trouvé.</CommandEmpty>
                            <ScrollArea className="h-72 w-full">
                              <CommandGroup>
                                {devis.data?.map((devi) => (
                                  <CommandItem
                                    name="devi"
                                    key={devi.id}
                                    value={devi.numero}
                                    onSelect={() => {
                                      setValue("devi",devi)
                                      setValue("client",null)
                                      setOpen(false);
                                      generateCommandeNumber();
                                    }}
                                  >
                                    {devi.numero}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </ScrollArea>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    {errors.clientId && (
                      <p className="text-red-500 text-sm mt-1 flex gap-1 items-center">
                        <CircleX className="h-4 w-4" />
                        {errors.clientId.message}
                      </p>
                    )}
                  </div>
                )}

                <div className="col-span-2">
                  <Label htmlFor="statut" className="text-right text-black">
                    Statut
                  </Label>
                  <Select
                    value={watch("statut")}
                    name="statut"
                    onValueChange={(value) => setValue("statut", value)}
                  >
                    <SelectTrigger className="col-span-3 bg-white focus:ring-purple-500 mt-2">
                      <SelectValue placeholder="Séléctionner un statut" />
                    </SelectTrigger>
                    <SelectContent>
                      {statuts.map((statut, index) => (
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
              <div className="grid grid-cols-2 items-center gap-6">
                <div className={`col-span-2 space-y-1 ${watch("devi") && "hidden"}`}>
                  {watch("client") && (
                    <>
                      <div className="w-full grid grid-cols-1">
                        <Label htmlFor="nom" className="text-left mb-2 mb-2">
                          Commande N°:
                        </Label>
                        <span className="text-md text-left text-gray-900 rounded-lg p-2 pl-4 bg-violet-50 h-[2.5rem]">
                          {watch("numero")}
                        </span>
                      </div>
                    </>
                  )}
                </div>
                <div className={`col-span-2 space-y-1 ${watch("client") && "hidden"}`}>
                  {watch("devi") && (
                    <>
                      <div className="w-full grid grid-cols-1">
                        <Label htmlFor="nom" className="text-left mb-2 mb-2">
                          Client :
                        </Label>
                        <span className="text-md text-left text-gray-900 rounded-lg p-2 pl-4 bg-violet-50 h-[2.5rem]">
                          {watch("devi")?.client.nom.toUpperCase()}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>
              <div className="grid gap-6 grid-cols-3">
                <div className="space-y-1">
                  <Label htmlFor="client">Date limite de livraison : </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal hover:text-purple-600 hover:bg-white hover:border-2 hover:border-purple-500",
                          !selectedDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2" />
                        {selectedDate ? (
                          format(new Date(selectedDate), "PPP", { locale: fr })
                        ) : (
                          <span>Choisis une date</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Controller
                        name="echeance"
                        control={control}
                        render={({ field }) => (
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            initialFocus
                          />
                        )}
                      />
                    </PopoverContent>
                  </Popover>
                  {errors.echeance && (
                    <p className="text-red-500 text-sm mt-1 flex gap-1 items-center">
                      <CircleX className="h-4 w-4" />
                      {errors.echeance.message}
                    </p>
                  )}
                </div>

                <div className="space-y-1">
                  <Label htmlFor="orderNumber">Avance :</Label>
                  <div className="relative w-full flex">
                    <div className="absolute border-2 border-gray-300 bg-white inset-y-0 right-0 w-12 flex items-center justify-center  rounded-r-md">
                      <span className="text-sm text-gray-800">MAD</span>
                    </div>
                    <Input
                      id="avance"
                      name="avance"
                      {...register("avance")}
                      className="focus:!ring-purple-500 pr-14 text-left rounded-r-md"
                    />
                  </div>
                  {errors.avance && (
                    <p className="text-red-500 text-sm mt-1 flex gap-1 items-center">
                      <CircleX className="h-4 w-4" />
                      {errors.avance.message}
                    </p>
                  )}
                </div>
                <div className="space-y-1">
                  <Label htmlFor="orderNumber">Compte :</Label>
                  <Select
                    value={watch("compte")}
                    name="compte"
                    onValueChange={(value) => setValue("compte", value)}
                  >
                    <SelectTrigger className="col-span-3 bg-white focus:ring-purple-500 mt-2">
                      <SelectValue placeholder="Séléctionner..." />
                    </SelectTrigger>
                    <SelectContent>
                      {comptes.data?.map((element) => (
                        <SelectItem key={element.id} value={element.compte}>
                          <div className="flex items-center gap-2">
                            {element.compte}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.compte && (
                    <p className="text-red-500 text-sm mt-1 flex gap-1 items-center">
                      <CircleX className="h-4 w-4" />
                      {errors.compte.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Items Table */}
              <div className="space-y-4">
                {items.length > 0 && (
                  <div className="overflow-hidden border rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[40%]">Produits</TableHead>
                          <TableHead>Quantité</TableHead>
                          <TableHead>Prix d&apos;unité</TableHead>
                          <TableHead colSpan={2} className="text-left">
                            Montant
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {items.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell>
                              <span className="focus:!ring-purple-500 text-md">
                                {item.designation}
                              </span>
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
                                value={item.prixUnite}
                                onChange={(e) => {
                                  console.log("item.prixUnite", item.prixUnite);

                                  handleItemChange(
                                    item.id,
                                    "prixUnite",
                                    Number(e.target.value)
                                  );
                                }}
                                className="focus:!ring-purple-500 w-24"
                              />
                            </TableCell>
                            <TableCell>
                              {(item.quantite * item.prixUnite).toFixed(2)} DH
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => removeItem(item.id)}
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
                )}
                {!switchValue && items.length > 0 && (
                  <div className="space-y-4 bg-violet-50 p-4 rounded-lg">
                    <div className="space-y-4">
                      <div className="flex justify-between py-2 font-bold">
                        <span>Total</span>
                        <span>{calculateTotal()} DH</span>
                      </div>
                    </div>
                  </div>
                )}
                {/* Totals Section */}
                {switchValue && items.length > 0 ? (
                  <div className="space-y-4 bg-violet-50 p-4 rounded-lg">
                    <div className="space-y-4">
                      <div className="flex justify-between py-2 border-b">
                        <span>Sous-total</span>
                        <span>{calculateSubTotal().toFixed(2)} DH</span>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <Label htmlFor="shippingCharges">
                            Frais de livraison
                          </Label>
                          <div className="relative w-40 flex">
                            <div className="absolute bg-white inset-y-0 right-0 w-12 flex items-center justify-center  border-l rounded-r-md">
                              <span className="text-sm  text-gray-800">
                                MAD
                              </span>
                            </div>
                            <Input
                              id="shippingCharges"
                              name="shippingCharges"
                              {...register("fraisLivraison")}
                              className="focus:!ring-purple-500 pr-14 text-left rounded-r-md"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="reduction">Réduction</Label>
                          <div className="flex items-center">
                            <div className="relative flex items-center">
                              <Input
                                id="reduction"
                                name="reduction"
                                {...register("reduction")}
                                className="focus:!ring-purple-500 w-40 pr-[60px]"
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
                        <span>Total</span>
                        <span>{calculateTotal()} DH</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  ""
                )}
                <AddButton
                  type="button"
                  onClick={() => setIsArticleDialogOpen(true)}
                  title="Ajouter un produit"
                />
                {errors.produits && (
                  <p className="text-red-500 text-sm mt-1 flex gap-1 items-center">
                    <CircleX className="h-4 w-4" />
                    {errors.produits.message}
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
                  Note :
                </Label>
                <Textarea
                  name="note"
                  {...register("note")}
                  className="col-span-3 focus-visible:ring-purple-300 focus-visible:ring-purple-500"
                />
              </div>
            </CardContent>
          </Card>
          <div className="flex justify-end items-center mt-3 ">
            <div className="space-x-2">
              <Link href="/ventes/commandes">
                <Button className="rounded-full" variant="outline">
                  Annuler
                </Button>
              </Link>
              <Button
                onClick={() => {
                  setValue(
                    "clientId",
                    watch("devi")?.client.id || watch("client")?.id
                  );

                  setValue("produits", items);
                  setValue("totalDevi", watch("devi").total);
                  setValue(
                    "sousTotal",
                    parseFloat(calculateSubTotal().toFixed(2))
                  );
                  setValue("total", parseFloat(calculateTotal()));
                  console.log(
                    "form data validation :",
                    newCommandeSchema.parse(watch())
                  );
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
