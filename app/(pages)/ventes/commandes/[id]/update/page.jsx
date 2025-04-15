"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AddButton } from "@/components/customUi/styledButton";
import { Textarea } from "@/components/ui/textarea";
import toast, { Toaster } from "react-hot-toast";
import { LoadingDots } from "@/components/loading-dots";
import Link from "next/link";
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
import { Trash2, MoveLeft } from "lucide-react";
import { ArticleSelectionDialog } from "@/components/produits-selection-dialog";
import { useRouter } from "next/navigation";
import axios from "axios";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { fr } from "date-fns/locale";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import updateCommandeSchema from "@/app/zodSchemas/updateCommandeSchema";

export default function UpdateCommandePage({ params }) {
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isArticleDialogOpen, setIsArticleDialogOpen] = useState(false);
  const router = useRouter();
  const {
    register,
    reset,
    watch,
    control,
    handleSubmit,
    setValue,
    formState: { isSubmiting },
  } = useForm({
    resolver: zodResolver(updateCommandeSchema),
  });

  const getCommandeById = async () => {
    const result = await axios.get(`/api/commandes/${params.id}`);
    const { commande } = result.data;
    const produits = commande.commandeProduits.map((article) => {
      return {
        id: article.produit.id,
        designation: article.produit.designation,
        quantite: article.quantite,
        prixUnite: article.prixUnite,
        montant: article.montant,
        stock: article.produit.stock,
      };
    });
    // setCommande(commande);
    setItems(produits);
    setValue("id", commande?.id);
    setValue("numero", commande?.numero);
    setValue("clientId", commande?.client.id);
    setValue("clientNom", commande?.client.nom);
    setValue("fraisLivraison", commande?.fraisLivraison);
    setValue("reduction", commande?.reduction);
    setValue("typeReduction", commande?.typeReduction);
    setValue("statut", commande?.statut);
    setValue("avance", commande?.avance);
    setValue("echeance", commande?.echeance);
    setValue("produits", commande?.commandeProduits);
    setIsLoading(false);
    console.log("commandeProduits : ", commande.commandeProduits);
    console.log("commande : ", commande);
  };
  useEffect(() => {
    getCommandeById();
  }, [params.id]);

  const selectedDate = watch("echeance");
  const onSubmit = (data) => {
    console.log(data);
    toast.promise(
      (async () => {
        const response = await fetch(`/api/commandes`, {
          method: "PUT",
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
        console.log("Commande modifier avec succès");
        router.push("/ventes/commandes");
      })(),
      {
        loading: "Modification du commande ...",
        success: "Commande modifier avec succès!",
        error: "Échec de l'modification du commande",
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

  const status = [
    { lable: "En cours", color: "amber-500" },
    { lable: "Expédiée", color: "blue-500" },
    { lable: "Livrée", color: "green-500" },
    { lable: "Annulé", color: "red-500" },
  ];
  return (
    <>
      <Toaster position="top-center" />
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="container mx-auto py-6 space-y-6 max-w-5xl mb-10">
          <div className="flex justify-between items-center">
            <div className="flex gap-3 items-center">
              <Link href="/ventes/commandes">
                <Button
                  type="button"
                  className="rounded-lg !p-0"
                  size="icon"
                  variant="ghost"
                >
                  <MoveLeft />
                </Button>
              </Link>

              <h1 className="text-3xl font-bold mr-2">Modifier une commande</h1>
              {isLoading && <LoadingDots size={7} />}
            </div>
          </div>

          <Card>
            <CardContent className="p-6 space-y-6">
              {/* Header Section */}
              <div className="grid grid-cols-4 items-center gap-6">
                <div className="col-span-2 grid gap-3">
                  <Label htmlFor="statut" className="text-left text-black">
                    Numéro de commande :
                  </Label>
                  <span className="text-md text-left text-gray-900 rounded-lg p-2 pl-4 bg-purple-50 h-[2.5rem]">
                    {watch("numero")}
                  </span>
                </div>
                <div className="col-span-2 grid gap-3">
                  <Label htmlFor="statut" className="text-left text-black">
                    Client :
                  </Label>

                  <span className="text-md text-left text-gray-900 rounded-lg p-2 pl-4 bg-purple-50 h-[2.5rem]">
                    {watch("clientNom")}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1">
                  <Label htmlFor="statut" className="text-right text-black">
                    Statut
                  </Label>
                  <Select
                    name="statut"
                    onValueChange={(value) => setValue("statut", value)}
                    value={watch("statut")}
                  >
                    <SelectTrigger className="col-span-3 bg-white focus:ring-purple-500 mt-2">
                      <SelectValue placeholder="Séléctionner un statut" />
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
                </div>
                {/* <div className="space-y-1">
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
                </div> */}
              </div>

              {/* Items Table */}
              <div className="space-y-4">
                {items.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[40%]">Produits</TableHead>
                        <TableHead>Quantité</TableHead>
                        <TableHead>Prix d&apos;unité</TableHead>
                        <TableHead>Montant</TableHead>
                        <TableHead></TableHead>
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
                              onChange={(e) =>
                                handleItemChange(
                                  item.id,
                                  "prixUnite",
                                  Number(e.target.value)
                                )
                              }
                              className="focus:!ring-purple-500 w-24"
                            />
                          </TableCell>
                          <TableCell>
                            {(item.quantite * item.prixUnite).toFixed(2)}
                            DH
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
                ) : null}

                <AddButton
                  type="button"
                  onClick={() => setIsArticleDialogOpen(true)}
                  title="Ajouter un produit"
                />
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
              {/* Totals Section */}
              <div className="space-y-4 bg-purple-50 p-4 rounded-lg">
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
                          <span className="text-sm  text-gray-800">MAD</span>
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
                            name="typeReduction"
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
            </CardContent>
          </Card>
          <div className="flex justify-end items-center">
            <div className="space-x-2">
              <Link href="/ventes/commandes">
                <Button className="rounded-full" variant="outline">
                  Annuler
                </Button>
              </Link>
              <Button
                onClick={() => {
                  setValue("produits", items);
                  setValue(
                    "sousTotal",
                    parseFloat(calculateSubTotal().toFixed(2))
                  );
                  setValue("total", parseFloat(calculateTotal()));
                  console.log("form data :", watch());
                  console.log(
                    "form data :",
                    updateCommandeSchema.parse(watch())
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
