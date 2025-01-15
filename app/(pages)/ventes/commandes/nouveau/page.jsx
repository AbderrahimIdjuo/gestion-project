"use client";

import { useState, useEffect, useMemo } from "react";
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
import { useRouter } from "next/navigation";
import { ScrollArea } from "@/components/ui/scroll-area";
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

export default function NouvelleCommandePage() {
  const [items, setItems] = useState([
    // { id: 1, details: "", quantity: 1, rate: 0, discount: 0, tax: 0 },
  ]);
  const [devisList, setDevisList] = useState([]);
  const [devi, setDevi] = useState();
  const [searchDeviQuery, setSearchDeviQuery] = useState("");
  const [date, setDate] = useState();


  const [formData, setFormData] = useState({
    customerName: "",
    deviNum: "",
    produits: [],
    orderNumber: "",
    orderDate: new Date().toISOString().split("T")[0],
    deliveryDate: "",
    statut: "En cours",
    shippingAddress: "",
    shippingCharges: 0,
    avance:0,
    discount: 0,
    discountType: "%",
    note: "",
    sousTotal: "",
    total: "",
  });

  const [isArticleDialogOpen, setIsArticleDialogOpen] = useState(false);
  const router = useRouter();

  const formattedDate = (date) => {
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0"); // months are 0-indexed
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const onSubmit = () => {
    const data = {
      clientId: devi.client.id,
      deviNum: formData.deviNum,
      produits: items,
      numero: `CMD-${devi?.numero.slice(4, 13)}`,
      echeance: formattedDate(date),
      statut: formData.statut,
      fraisLivraison: parseFloat(formData.shippingCharges),
      reduction: parseInt(formData.discount),
      typeReduction: formData.discountType,
      avance : parseInt(formData.avance),
      note: formData.note,
      sousTotal: parseFloat(calculateSubTotal().toFixed(2)),
      total: parseFloat(calculateTotal()),
    };
    console.log(data);
    
    toast.promise(
      (async () => {
        try {
          const response = await axios.post("/api/commandes", data);
          console.log("Commande ajouté avec succès");
          // setFormData((prev) => ({
          //   ...prev,
          //   customerName: "",
          //   salesperson: "",
          //   shippingCharges: 0,
          //   discount: 0,
          //   statut: "En attente",
          //   discountType: "%",
          //   customerNotes: "",
          // }));
          // setItems([{ id: 1, details: "", quantity: 1, rate: 0 }]);
          if (response.status === 200) {
            console.log("Commande ajouté avec succès");
          } else {
            throw new Error("Unexpected response status");
          }
        } catch (error) {
          console.log(error);
        }
      })(),
      {
        loading: "Ajout du commande ...",
        success: "Commande ajouté avec succès!",
        error: "Échec de l'ajout du commande",
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

  const handleAddArticles = (newArticles) => {
    setItems((prevItems) => [
      ...prevItems,
      ...newArticles.map((article) => ({
        ...article,
        discount: 0,
        tax: 0,
      })),
    ]);
  };

  const removeItem = (id) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const calculateSubTotal = () => {
    return items.reduce((sum, item) => {
      const amount = item.quantity * item.rate * (1 - item.discount / 100);
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

  const getDevis = async () => {
    const result = await axios.get("/api/devis");
    const { devis } = result.data;
    setDevisList(devis);
  };

  useEffect(() => {
    getDevis();
  }, []);
  const filteredDevis = useMemo(() => {
    return devisList.filter((devi) =>
      devi.numero.toLowerCase().includes(searchDeviQuery.toLowerCase())
    );
  }, [devisList, searchDeviQuery]);

  const status = [
    { lable: "En cours", color: "amber-500" },
    { lable: "Expédiée", color: "blue-500" },
    { lable: "Livrée", color: "green-500" },
    { lable: "Annulé", color: "red-500" },
  ];
  return (
    <>
      <Toaster position="top-center" />
      <div className="container mx-auto py-6 space-y-6 max-w-5xl">
        <div className="flex justify-between items-center">
          <div className="flex gap-3 items-center">
            <Button
              className="rounded-lg !p-0"
              size="icon"
              variant="ghost"
              onClick={() => router.push("/ventes/commandes")}
            >
              <MoveLeft />
            </Button>
            <h1 className="text-3xl font-bold">Nouvelle Commande</h1>
          </div>
        </div>

        <Card>
          <CardContent className="p-6 space-y-6">
            {/* Header Section */}

            <div className="grid grid-cols-4 items-center gap-6">
              <div className="col-span-2">
                <Label htmlFor="deviNum">Numero de devi*</Label>
                <Select
                  value={formData.deviNum}
                  onValueChange={(value) => {
                    // Find the selected client based on the name
                    const selectedDevi = devisList.find(
                      (devi) => devi.numero === value
                    );

                    setDevi(selectedDevi);
                    setFormData((prev) => ({
                      ...prev,
                      customerName: selectedDevi.client.nom,
                    }));

                    handleInputChange({
                      target: { name: "deviNum", value },
                    });
                  }}
                >
                  <SelectTrigger className="col-span-3 bg-white focus:ring-purple-500 mt-2">
                    <SelectValue placeholder="Sélectionner un devi" />
                  </SelectTrigger>
                  <SelectContent>
                    {/* Search input */}
                    <div className="p-2">
                      <Input
                        type="text"
                        placeholder="Rechercher un devi ..."
                        value={searchDeviQuery}
                        onChange={(e) => setSearchDeviQuery(e.target.value)}
                        className="relative pl-9 w-full rounded-lg bg-zinc-100 focus:bg-white focus-visible:ring-purple-500 focus-visible:ring-offset-0"
                      />
                    </div>

                    {/* Filtered client list */}
                    <ScrollArea className="h-56 w-48  w-full">
                      {filteredDevis.length > 0 ? (
                        filteredDevis.map((devi) => (
                          <SelectItem key={devi.id} value={devi.numero}>
                            {devi.numero}
                          </SelectItem>
                        ))
                      ) : (
                        <div className="p-2 ml-2 text-sm text-zinc-500">
                          Aucun devi trouvé
                        </div>
                      )}
                    </ScrollArea>
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2">
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
            </div>
            <div className="flex flex-rows gap-3 justify-between">
              <div className="col-span-1 space-y-1">
                {devi && (
                  <>
                    <Label htmlFor="client">Client : </Label>
                    <span className="mt-3 font-bold">
                      {devi.client.nom.toUpperCase()}
                    </span>
                  </>
                )}
              </div>
              <div className="col-span-2">
                {devi && (
                  <>
                    <Label htmlFor="orderNumber">Numéro de commande : </Label>
                    <span className="mt-3 font-bold">{`CMD-${devi?.numero.slice(
                      4,
                      13
                    )}`}</span>
                  </>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-1">
                <Label htmlFor="client">Date limite de livraison : </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal hover:text-purple-600 hover:bg-white hover:border-2 hover:border-purple-500",
                        !date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon />
                      {date ? (
                        format(date, "PPP", { locale: fr })
                      ) : (
                        <span>Choisis une date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={setDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
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
                    value={formData.avance}
                    onChange={handleInputChange}
                    className="focus:!ring-purple-500 pr-14 text-left rounded-r-md"
                  />
                </div>
              </div>
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
                          <Input
                            value={item.details}
                            onChange={(e) =>
                              handleItemChange(
                                item.id,
                                "details",
                                e.target.value
                              )
                            }
                            spellCheck="false"
                            placeholder="Designation du produit"
                            className="focus:!ring-purple-500"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={item.quantity}
                            onChange={(e) =>
                              handleItemChange(
                                item.id,
                                "quantity",
                                Number(e.target.value)
                              )
                            }
                            className="focus:!ring-purple-500 w-20"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={item.rate}
                            onChange={(e) =>
                              handleItemChange(
                                item.id,
                                "rate",
                                Number(e.target.value)
                              )
                            }
                            className="focus:!ring-purple-500 w-24"
                          />
                        </TableCell>
                        <TableCell>
                          {(
                            item.quantity *
                            item.rate *
                            (1 - item.discount / 100)
                          ).toFixed(2)}{" "}
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
                value={formData.note}
                onChange={handleInputChange}
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
                    <Label htmlFor="shippingCharges">Frais de livraison</Label>
                    <div className="relative w-40 flex">
                      <div className="absolute bg-white inset-y-0 right-0 w-12 flex items-center justify-center  border-l rounded-r-md">
                        <span className="text-sm  text-gray-800">MAD</span>
                      </div>
                      <Input
                        id="shippingCharges"
                        name="shippingCharges"
                        value={formData.shippingCharges}
                        onChange={handleInputChange}
                        className="focus:!ring-purple-500 pr-14 text-left rounded-r-md"
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
                          className="focus:!ring-purple-500 w-40 pr-[60px]"
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
                  <span>{calculateTotal()} DH</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        <div className="flex justify-end items-center">
          <div className="space-x-2">
            <Button className="rounded-full" variant="outline">
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
