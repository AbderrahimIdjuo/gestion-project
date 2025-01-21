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
import { Plus, Trash2, MoveLeftIcon, Check, ChevronDown } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
import { cn } from "@/lib/utils";
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

export default function UpdateDevisPage({ params }) {
  const [clientList, setClientList] = useState([]);
  const [searchClientQuery, setSearchClientQuery] = useState("");
  const [client, setClient] = useState("");
  const [items, setItems] = useState();
  const [devi, setDevi] = useState();
  const [isLoading, setIsLoading] = useState(true);
  const [deletedArticls, setDeletedArticls] = useState([]);
  const [open, setOpen] = useState(false);
const [value, setValue] = useState("");
  const [formData, setFormData] = useState({
    customerName: "",
    quoteDate: new Date().toISOString().split("T")[0],
    salesperson: "",
    shippingCharges: 0,
    discount: 0,
    statut: "En attente",
    discountType: "%",
    customerNotes: "",
  });

  const status = [
    { lable: "En attente", color: "amber-500" },
    { lable: "Accepté", color: "green-500" },
    { lable: "Refusé", color: "red-500" },
  ];

  const router = useRouter();
  const getDevisById = async () => {
    const result = await axios.get(`/api/devis/${params.id}`);
    const { devi } = result.data;
    setDevi(devi);
    setItems(devi.articls);
    setClient(devi.client);
    setValue(devi.client.nom);
    setFormData((prev) => ({
      ...prev,
      customerName: devi?.client.nom,
      shippingCharges: devi?.fraisLivraison,
      discount: devi?.reduction,
      statut: devi?.statut,
      discountType: devi?.typeReduction,
      customerNotes: devi?.note,
    }));
    setIsLoading(false)
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

  const filteredClients = clientList.filter((client) =>
    client.nom.toLowerCase().startsWith(searchClientQuery.toLowerCase())
  );

  useEffect(() => {
    getClients();
  }, []);

  const onSubmit = async () => {

    const data = {
      id: devi?.id,
      numero: devi?.numero,
      clientId: client.id,
      articls: items,
      statut: formData.statut,
      sousTotal: calculateSubTotal(),
      fraisLivraison: Math.max(0, formData.shippingCharges),
      reduction: Math.max(0, formData.discount),
      total: calculateTotal(),
      typeReduction: formData.discountType,
      note: formData.customerNotes,
    };
console.log('data',data);

    toast.promise(
      (async () => {
        try {
          if(deletedArticls.length >0){
            await axios.delete("/api/devis", {
              data: { ids: deletedArticls },
            });
          }
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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleItemChange = (id, field, value) => {
    setItems((prevItems) =>
      prevItems.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  };

  const addNewItem = () => {
    setItems((prev) => [
      ...prev,
      {
        id: prev.length + 1,
        designation: "",
        quantite: 1,
        rate: 0,
      },
    ]);
  };

  const removeItem = (id) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
    setDeletedArticls((prev) => [...prev, id]);
  };

  const calculateSubTotal = () => {
    return items?.reduce((sum, item) => {
      const amount = item.quantite * item.prixUnite;
      return sum + amount;
    }, 0);
  };

  const calculateTotal = () => {
    const subtotal = calculateSubTotal();
    const discountAmount =
      formData.discountType === "%"
        ? subtotal * (formData.discount / 100)
        : Number(formData.discount);
    const total = subtotal - discountAmount + Number(formData.shippingCharges);
    return total.toFixed(2);
  };

  return (
    <>
      <Toaster position="top-center" />
      <div className="container mx-auto py-6 space-y-6 max-w-5xl">
        <div className="flex justify-between items-center">
          <div className="flex gap-3 items-center">
            <Button
              className="rounded-lg"
              size="icon"
              variant="ghost"
              onClick={() => router.push("/ventes/devis")}
            >
              <MoveLeftIcon />
            </Button>
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
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        className="w-full justify-between"
                      >
                        {value
                          ? clientList?.find((client) => client.nom === value)
                              ?.nom
                          : "Sélectioner un client..."}
                        <ChevronDown className="opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto min-w-[27vw] p-0">
                      <Command>
                        <CommandInput
                          placeholder="Search client..."
                          className="h-9"
                        />
                        <CommandList>
                          <CommandEmpty>No client found.</CommandEmpty>
                          <ScrollArea className="h-72 w-full">
                            <CommandGroup>
                              {clientList?.map((client) => (
                                <CommandItem
                                  key={client.id}
                                  value={client.nom}
                                  onSelect={(currentValue) => {
                                    setValue(
                                      currentValue === value ? "" : currentValue
                                    );
                                    setClient(client);
                                    setOpen(false);
                                  }}
                                >
                                  {client.nom}
                                  <Check
                                    className={cn(
                                      "ml-auto",
                                      value === client.nom
                                        ? "opacity-100"
                                        : "opacity-0"
                                    )}
                                  />
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
                  value={formData.statut}
                  name="statut"
                  onValueChange={(value) =>
                    handleInputChange({
                      target: { name: "statut", value },
                    })
                  }
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
                    <TableHead className="w-[40%]">Désignation</TableHead>
                    <TableHead>Quantité</TableHead>
                    <TableHead>Prix d&apos;unité</TableHead>
                    <TableHead>Montant</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items?.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <Input
                          className="focus:!ring-purple-500"
                          value={item.designation}
                          onChange={(e) => {
                            handleItemChange(
                              item.id,
                              "designation",
                              e.target.value
                            );
                          }}
                          placeholder="Description de l'article"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min={1}
                          className="focus:!ring-purple-500 w-20"
                          value={item.quantite}
                          onChange={(e) =>
                            handleItemChange(
                              item.id,
                              "quantite",
                              Number(e.target.value)
                            )
                          }
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
                        {(item.quantite * item.prixUnite).toFixed(2)} MAD
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

              <Button
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
                name="customerNotes"
                value={formData.customerNotes}
                onChange={handleInputChange}
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
                    <Label htmlFor="shippingCharges">Frais de livraison</Label>
                    <div className="relative w-40 flex">
                      <div className="absolute inset-y-0 right-0 w-12 flex items-center justify-center bg-white border-l rounded-r-md">
                        <span className="text-sm text-gray-600">MAD</span>
                      </div>
                      <Input
                        id="shippingCharges"
                        name="shippingCharges"
                        value={formData.shippingCharges}
                        onChange={handleInputChange}
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
                          id="discount"
                          name="discount"
                          value={formData.discount}
                          onChange={handleInputChange}
                          className="w-40 pr-[70px] focus:!ring-purple-500"
                        />
                        <Select
                          value={formData.discountType}
                          onValueChange={(value) =>
                            handleInputChange({
                              target: { name: "discountType", value },
                            })
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
            <Button
              className="rounded-full"
              onClick={() => router.push("/ventes/devis")}
              variant="outline"
            >
              Annuler
            </Button>
            <Button
              onClick={() => {
                onSubmit();
              }}
              className="bg-gradient-to-r from-fuchsia-500 via-purple-500 to-violet-500 hover:bg-purple-600 hover:scale-105 text-white hover:!text-white font-semibold transition-all duration-300 transform rounded-full"
            >
              Enregistrer
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
