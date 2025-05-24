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
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Trash2, MoveLeft } from "lucide-react";
import { ArticleSelectionDialog } from "@/components/produits-selection-dialog";
import Link from "next/link";
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
import { CircleX } from "lucide-react";
import { useRouter } from "next/navigation";
import newCommandeSchema from "@/app/zodSchemas/newCommandeSchema";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export default function NouvelleCommandePage() {
  const [items, setItems] = useState([]);
  const [isArticleDialogOpen, setIsArticleDialogOpen] = useState(false);
  const [devi, setDevi] = useState("");
  const router = useRouter();
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
      statut: "En cours",
      avance: 0,
      reduction: 0,
      typeReduction: "%",
    },
    resolver: zodResolver(newCommandeSchema),
  });
  const queryClient = useQueryClient();
  const selectedDate = watch("echeance");
  useEffect(() => {
    const storedData = localStorage.getItem("devi");
    if (storedData) {
      setDevi(JSON.parse(storedData));
    }
  }, []);

  useEffect(() => {
    setValue("devi", devi);
  }, [devi]);

  const statuts = [
    { value: "En cours", lable: "En cours", color: "amber-500" },
    { value: "Expédiée", lable: "Expédiée", color: "blue-500" },
    { value: "Livrée", lable: "Livrée", color: "green-500" },
    { value: "Annulé", lable: "Annulé", color: "red-500" },
  ];

  const comptes = useQuery({
    queryKey: ["comptes"],
    queryFn: async () => {
      const response = await axios.get("/api/comptesBancaires");
      const comptes = response.data.comptes;
      return comptes;
    },
  });

  const createCommande = useMutation({
    mutationFn: async (data) => {
      const loadingToast = toast.loading("Ajout du commande ...");
      try {
        await axios.post("/api/commandes", data);
        toast.success("Commande ajouté avec succès!");
      } catch (error) {
        toast.error("Échec de l'ajout!");
        throw error;
      } finally {
        toast.dismiss(loadingToast);
      }
    },
    onSuccess: () => {
      reset();
      setItems([]);
      queryClient.invalidateQueries(["commandes"]);
      queryClient.invalidateQueries(["devis"]);
      router.push("/ventes/commandes");
    },
  });
  const onSubmit = async (data) => {
    createCommande.mutate(data);
  };

  const handleItemChange = (id, field, value) => {
    // // Convertit les virgules en points et en nombre
    setItems((prevItems) =>
      prevItems.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  };

  const handleAddArticles = (newArticles) => {
    console.log("newArticles", newArticles);

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
    const total = subtotal - discountAmount;
    return total.toFixed(2);
  };
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
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="container mb-[5rem] mx-auto space-y-6 w-full">
          <div className="flex justify-between items-center">
            <div className="flex gap-3 items-center">
              <h1 className="text-3xl font-bold">Nouvelle Commande</h1>
            </div>
          </div>

          <Card>
            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-3 gap-3">
                <div className="w-full grid grid-cols-1">
                  <Label htmlFor="nom" className="text-left mb-2 mb-2">
                    Numéro de devi :
                  </Label>
                  <span className="text-md text-left text-gray-900 rounded-lg p-2 pl-4 bg-violet-50 h-[2.5rem]">
                    {devi.numero}
                  </span>
                </div>
                <div className="w-full grid grid-cols-1">
                  <Label htmlFor="nom" className="text-left mb-2 mb-2">
                    Client :
                  </Label>
                  <span className="text-md text-left text-gray-900 rounded-lg p-2 pl-4 bg-violet-50 h-[2.5rem]">
                    {devi?.client?.nom.toUpperCase()}
                  </span>
                </div>
                <div className="w-full grid grid-cols-1">
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
                  <>
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
                          {items.map((item ,index) => (
                            <TableRow key={item.id}>
                              <TableCell>
                                <span className="focus:!ring-purple-500 text-md">
                                  {item.designation}
                                </span>
                              </TableCell>
                              <TableCell>
                                <Input
                                  defaultValue={item.quantite}
                                  onChange={(e) => {
                                    handleItemChange(
                                      item.id,
                                      "quantite",
                                      validateFloat(e.target.value)
                                    );
                                  }}
                                  className="focus:!ring-purple-500 w-20"
                                />
                                 {errors.produits?.[index]?.quantite && (
                                  <p className="text-xs text-red-500 mt-1">
                                    {errors.produits?.[index].quantite.message}
                                  </p>
                                )}
                              </TableCell>
                              <TableCell>                      
                                <Input
                                  defaultValue={item.prixUnite}
                                  onChange={(e) => {
                                    handleItemChange(
                                      item.id,
                                      "prixUnite",
                                      validateFloat(e.target.value)
                                    );
                                  }}
                                  className="focus:!ring-purple-500 w-24"
                                />
                                  {errors.produits?.[index]?.prixUnite && (
                                  <p className="text-xs text-red-500 mt-1">
                                    {errors.produits[index].prixUnite.message}
                                  </p>
                                )}
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
                          {calculateTotal() > 0 && (
                            <TableRow>
                              <TableCell
                                colSpan={3}
                                className="text-right text-lg font-bold"
                              >
                                Total :
                              </TableCell>
                              <TableCell
                                colSpan={2}
                                className="text-left text-lg font-bold"
                              >
                                {calculateTotal()} DH
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </>
                )}

                <AddButton
                  type="button"
                  onClick={() => setIsArticleDialogOpen(true)}
                  title="Ajouter des produits"
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
              <Link href="/ventes/devis">
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
                  setValue("numero", `CMD-${devi?.numero?.slice(4, 13)}`);

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
