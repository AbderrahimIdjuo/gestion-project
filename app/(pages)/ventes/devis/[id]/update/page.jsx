"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { Textarea } from "@/components/ui/textarea";
import { LoadingDots } from "@/components/loading-dots";
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
import { Plus, Trash2, MoveLeftIcon, ChevronDown } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import Link from "next/link";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import updateDeviSchema from "@/app/zodSchemas/updateDeviSchema";

export default function UpdateDevisPage({ params }) {
  const [clientList, setClientList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const {
    register,
    watch,
    control,
    setValue,
    handleSubmit,
    formState: { isSubmiting },
  } = useForm({
    defaultValues: {
      articls: [],
    },
    resolver: zodResolver(updateDeviSchema),
  });
  const { fields, remove } = useFieldArray({
    control,
    name: "articls",
  });
  const articls = watch("articls");
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
    setValue("client", devi?.client);
    setValue("statut", devi?.statut);
    setValue("fraisLivraison", devi?.fraisLivraison);
    setValue("reduction", devi?.reduction);
    setValue("typeReduction", devi?.typeReduction);
    setValue("id", devi?.id);
    setValue("numero", devi?.numero);
    setValue("clientId", devi?.clientId);
    setIsLoading(false);
    console.log("Articls : ", devi.articls);
    console.log("devi : ", devi);
  };
  useEffect(() => {
    getDevisById();
  }, [params.id]);

  const getClients = async () => {
    const result = await axios.get("/api/clients");
    const { Clients } = result.data;
    setClientList(Clients);
  };

  useEffect(() => {
    getClients();
  }, []);

  const onSubmit = async (data) => {
    console.log("data", data);

    toast.promise(
      (async () => {
        try {
          const response = await axios.put("/api/devis", data);
          console.log("Devi ajouté avec succès");
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
        loading: "Ajout du devi ...",
        success: "Devi modifier avec succès!",
        error: "Échec de la modification du devi",
      }
    );
  };

  const addNewItem = () => {
    const currentItems = watch("articls") || [];
    setValue("articls", [
      ...currentItems,
      {
        id: Date.now().toString(),
        designation: "",
        quantite: 1,
        prixUnite: 1,
      },
    ]);
  };

  const calculateSubTotal = () => {
    return watch("articls")?.reduce((sum, item) => {
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
  return (
    <>
      <Toaster position="top-center" />
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="container mb-10 mx-auto py-6 space-y-6 max-w-5xl caret-transparent">
          <div className="flex justify-between items-center">
            <div className="flex gap-3 items-center">
              <Link href="/ventes/devis">
                <Button className="rounded-lg" size="icon" variant="ghost">
                  <MoveLeftIcon />
                </Button>
              </Link>
              <h1 className="text-3xl font-bold">Modifier Devis</h1>
              {isLoading && <LoadingDots size={7} />}
            </div>
          </div>
          <Card>
            <CardContent className="p-6 space-y-6">
              {/* Header Section */}
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="customerName">Client*</Label>
                    <br />
                    <Popover open={open} onOpenChange={setOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          role="combobox"
                          aria-expanded={open}
                          className="w-full justify-between mt-2"
                        >
                          {watch("client")
                            ? watch("client").nom.toUpperCase()
                            : "Sélectioner un client..."}
                          <ChevronDown className="opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto min-w-[25vw] p-0">
                        <Command>
                          <CommandInput
                            placeholder="Chercher un client..."
                            className="h-9"
                          />
                          <CommandList>
                            <CommandEmpty>Aucun client trouvé.</CommandEmpty>
                            <ScrollArea className="h-72 w-full">
                              <CommandGroup>
                                {clientList?.map((client) => (
                                  <CommandItem
                                    name="client"
                                    key={client.id}
                                    value={client.nom}
                                    onSelect={() => {
                                      setOpen(false);
                                      setValue("client", client);
                                      setValue("clientId", client.id);
                                    }}
                                  >
                                    {client.nom.toUpperCase()}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </ScrollArea>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>
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
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[35%]">Désignation</TableHead>
                      <TableHead className="w-[15%]">Quantité</TableHead>
                      <TableHead className="w-[20%]">
                        Prix d&apos;unité
                      </TableHead>
                      <TableHead>Montant</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fields.map((item, index) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <Controller
                            control={control}
                            name={`articls.${index}.designation`}
                            render={({ field }) => (
                              <Input
                                className="focus:!ring-purple-500 w-full"
                                {...field}
                                placeholder="Description de l'article"
                                spellCheck="false"
                              />
                            )}
                          />
                        </TableCell>
                        <TableCell>
                          <Controller
                            control={control}
                            name={`articls.${index}.quantite`}
                            render={({ field }) => (
                              <Input
                                {...field}
                                type="number"
                                min={1}
                                className="focus:!ring-purple-500 w-full"
                              />
                            )}
                          />
                        </TableCell>
                        <TableCell>
                          <Controller
                            control={control}
                            name={`articls.${index}.prixUnite`}
                            render={({ field }) => (
                              <Input
                                className="focus:!ring-purple-500 w-full"
                                {...field}
                                type="number"
                              />
                            )}
                          />
                        </TableCell>
                        <TableCell>
                          {(
                            articls[index].quantite * articls[index].prixUnite
                          ).toFixed(2)}{" "}
                          MAD
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => remove(index)}
                            className="h-8 w-8 rounded-full hover:bg-red-100 hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                <Button
                  type="button"
                  variant="outline"
                  onClick={addNewItem}
                  className="bg-gradient-to-r from-fuchsia-500 via-purple-500 to-violet-500 hover:bg-purple-600 rounded-full hover:scale-105 text-white hover:!text-white font-semibold transition-all duration-300 transform"
                >
                  <Plus className="h-4 w-4" />
                  Ajouter un article
                </Button>
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
                    <span>Sous-total</span>
                    <span>{calculateSubTotal()?.toFixed(2)} MAD</span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label htmlFor="shippingCharges">
                        Frais de livraison
                      </Label>
                      <div className="relative w-40 flex">
                        <div className="absolute inset-y-0 right-0 w-12 flex items-center justify-center bg-white border-l rounded-r-md">
                          <span className="text-sm text-gray-600">MAD</span>
                        </div>
                        <Input
                          id="shippingCharges"
                          name="shippingCharges"
                          {...register("fraisLivraison")}
                          className="pr-14 text-left rounded-r-md focus:!ring-purple-500"
                        />
                      </div>
                    </div>
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
                    <span>Total</span>
                    <span>{calculateTotal()} MAD</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          <div className="flex justify-end items-center">
            <div className="space-x-2">
              <Link href="/ventes/devis">
                <Button className="rounded-full" variant="outline">
                  Annuler
                </Button>
              </Link>
              <Button
                type="submit"
                disabled={isSubmiting}
                onClick={() => {
                  setValue(
                    "sousTotal",
                    parseFloat(calculateSubTotal().toFixed(2))
                  );
                  setValue("total", parseFloat(calculateTotal()));
                  console.log(
                    "form data validation :",
                    updateDeviSchema.parse(watch())
                  );
                }}
                className="bg-gradient-to-r from-fuchsia-500 via-purple-500 to-violet-500 hover:bg-purple-600 hover:scale-105 text-white hover:!text-white font-semibold transition-all duration-300 transform rounded-full"
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
