"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
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
import { Trash2, CircleX, Copy } from "lucide-react";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
import { customAlphabet } from "nanoid";
import ComboBoxClients from "@/components/comboBox-clients";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import updateDeviSchema from "@/app/zodSchemas/updateDeviSchema";
import { AddButton } from "@/components/customUi/styledButton";
import { ArticleSelectionDialog } from "@/components/articls-selection-dialog";
import { LoadingDots } from "@/components/loading-dots";
import { Switch } from "@/components/ui/switch";
import { useQuery } from "@tanstack/react-query";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useForm, Controller } from "react-hook-form";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { fr } from "date-fns/locale";

export default function UpdateDevisPage({ params }) {
  const [LoadingDevis, setLoadingDevis] = useState(true);
  const [items, setItems] = useState([]);
  const [activerTVA, setActiverTVA] = useState(false);
  const [client, setClient] = useState(null);
  const [isArticleDialogOpen, setIsArticleDialogOpen] = useState(false);
  const {
    register,
    watch,
    control,
    setValue,
    handleSubmit,
    formState: { errors, isSubmiting },
  } = useForm({
    defaultValues: {
      articls: [],
      unite: "U",
    },
    resolver: zodResolver(updateDeviSchema),
  });
  const selectedDate = watch("echeance");
  const router = useRouter();
  const status = [
    { lable: "En attente", color: "amber-500" },
    { lable: "Accepté", color: "green-500" },
    { lable: "Annulé", color: "red-500" },
  ];

  const getDevisById = async () => {
    const result = await axios.get(`/api/devis/${params.id}`);
    const { devi } = result.data;

    setValue("articls", devi?.articls);
    setClient(devi?.client);
    setValue("statut", devi?.statut);
    setValue("avance", devi?.avance);
    setValue("compte", devi?.compte);
    setValue("echeance", new Date(devi?.echeance));
    setActiverTVA(devi?.tva > 0 ? true : false);
    setValue("reduction", devi?.reduction);
    setValue("typeReduction", devi?.typeReduction);
    setValue("id", devi?.id);
    setValue("numero", devi?.numero);
    setValue("clientId", devi?.clientId);
    setItems(devi?.articls);
    setLoadingDevis(false);
  };
  useEffect(() => {
    getDevisById();
  }, [params.id]);
  const generateUniqueKey = () => {
    const digits = "1234567890";
    const nanoidCustom = customAlphabet(digits, 6);
    return nanoidCustom();
  };
  const onSubmit = async (data) => {
    toast.promise(
      (async () => {
        try {
          const response = await axios.put("/api/devis", data);
          router.push("/ventes/devis");
          if (response.status === 200) {
            console.log("Devi modifier avec succès");
          } else {
            throw new Error("Unexpected response status");
          }
        } catch (error) {
          console.log(error);
        }
      })(),
      {
        loading: "modification du devi ...",
        success: "Devi modifier avec succès!",
        error: "Échec de la modification du devi",
      }
    );
  };

  const handleItemChange = (key, field, value) => {
    setItems((prevItems) =>
      prevItems.map((item) =>
        item.key === key ? { ...item, [field]: value } : item
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
  const removeItem = (deletedItem) => {
    setItems((prev) => prev.filter((item) => item.key !== deletedItem.key));
  };
  const calculateSubTotal = () => {
    const subtotal = items.reduce((sum, item) => {
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
    return calculateSubTotal() * 0.2;
  };
  const calculateTotal = () => {
    if (activerTVA) {
      return (calculateSubTotal() + calculateTVA()).toFixed(2);
    }
    return calculateSubTotal();
  };

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
      <form className="m-0 p-0" onSubmit={handleSubmit(onSubmit)}>
        <div className="container mb-10 mx-auto py-6 space-y-6 w-full">
          <div className="flex justify-between items-center">
            <div className="flex gap-3 items-center">
              <h1 className="text-3xl font-bold">
                Modifier le devis : {watch("numero")}{" "}
              </h1>
              {LoadingDevis && <LoadingDots size={7} />}
            </div>
          </div>
          <Card className="w-full">
            <CardContent className="p-6 space-y-6">
              {/* Header Section */}
              <div className="grid grid-cols-3 gap-6">
                <div>
                  <ComboBoxClients setClient={setClient} client={client} />
                  {errors.clientId && (
                    <p className="text-red-500 text-sm mt-1 flex gap-1 items-center">
                      <CircleX className="h-4 w-4" />
                      {errors.clientId.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
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
                            onSelect={(date) => {
                              if (date) {
                                // Set to midnight UTC
                                const utcMidnight = new Date(
                                  Date.UTC(
                                    date.getFullYear(),
                                    date.getMonth(),
                                    date.getDate()
                                  )
                                );
                                field.onChange(utcMidnight);
                              }
                            }}
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
              <div className="grid gap-6 grid-cols-3"></div>
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
                            <TableHead className="text-left">Montant</TableHead>
                            <TableHead className="text-right pr-3">
                              Actions
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {items.map((item, index) => (
                            <TableRow key={item.key}>
                              <TableCell>
                                <Input
                                  spellCheck="false"
                                  defaultValue={item.designation}
                                  onChange={(e) => {
                                    handleItemChange(
                                      item.key,
                                      "designation",
                                      e.target.value
                                    );
                                  }}
                                  className={`focus:!ring-purple-500 w-full ${
                                    errors.articls?.[index]?.length &&
                                    "!border-red-500"
                                  }`}
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  defaultValue={item.length}
                                  onChange={(e) => {
                                    handleItemChange(
                                      item.key,
                                      "length",
                                      Number(e.target.value)
                                    );
                                  }}
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
                                  defaultValue={item.width}
                                  onChange={(e) =>
                                    handleItemChange(
                                      item.key,
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
                                  defaultValue={item.unite || "U"}
                                  name="unites"
                                  onValueChange={(value) =>
                                    handleItemChange(item.key, "unite", value)
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
                                  defaultValue={item.quantite}
                                  type="number"
                                  min={1}
                                  onChange={(e) =>
                                    handleItemChange(
                                      item.key,
                                      "quantite",
                                      validateFloat(e.target.value)
                                    )
                                  }
                                  className="focus:!ring-purple-500 w-20"
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  defaultValue={item.prixUnite}
                                  onChange={(e) => {
                                    handleItemChange(
                                      item.key,
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
                              <TableCell className="pr-3">
                                <div className="flex justify-end gap-1">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => removeItem(item)}
                                    className="h-8 w-8 rounded-full hover:bg-red-100 hover:text-red-600"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    type="button" // <- important pour ne PAS soumettre
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => {
                                      const origineItem = items.find(
                                        (i) => i.key === item.key
                                      );
                                      console.log("origineItem", origineItem);

                                      setItems((prevItems) => [
                                        ...prevItems,
                                        {
                                          ...item,
                                          designation: origineItem.designation,
                                          quantite: origineItem.quantite,
                                          prixUnite: origineItem.prixUnite,
                                          length: origineItem.length,
                                          width: origineItem.width,
                                          unite: origineItem.unite,
                                          key: generateUniqueKey(),
                                        },
                                      ]);
                                      console.log("Cloned item");
                                      console.log("items", items);
                                    }}
                                    className="h-8 w-8 rounded-full hover:bg-blue-100 hover:text-blue-600"
                                  >
                                    <Copy className="h-4 w-4" />
                                  </Button>
                                </div>
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
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="switch"
                        checked={activerTVA}
                        onCheckedChange={setActiverTVA}
                      />
                      <Label htmlFor="switch">
                        {activerTVA ? "TVA de 20% est activé" : "TVA désactivé"}
                      </Label>
                    </div>
                    {activerTVA && <span>{calculateTVA().toFixed(2)} MAD</span>}
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
          <div className="flex justify-end items-center">
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
                  setValue("clientId", client?.id);
                  setValue(
                    "sousTotal",
                    parseFloat(calculateSubTotal().toFixed(2))
                  );
                  setValue("tva", activerTVA ? calculateTVA().toFixed(2) : 0);
                  setValue("total", parseFloat(calculateTotal()));
                  setValue("articls", items);
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
