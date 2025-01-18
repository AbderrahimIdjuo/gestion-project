"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AddButton } from "@/components/customUi/styledButton";
import { Textarea } from "@/components/ui/textarea";
import toast, { Toaster } from "react-hot-toast";
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
import { Trash2, MoveLeft } from "lucide-react";
import { ArticleSelectionDialog } from "@/components/produits-selection-dialog";
import { useRouter } from "next/navigation";
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

export default function UpdateCommandePage({ params }) {
  const [items, setItems] = useState([]);
  const [devisList, setDevisList] = useState([]);
  const [devi, setDevi] = useState();
  const [commande, setCommande] = useState();
  const [searchDeviQuery, setSearchDeviQuery] = useState("");
  const [date, setDate] = useState();
  const [clientList, setClientList] = useState([]);
  const [client, setClient] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [searchClientQuery, setSearchClientQuery] = useState("");

  const [formData, setFormData] = useState({
    customerName: "",
    numero: "",
    clientId: "",
    produits: [],
    orderNumber: "",
    orderDate: new Date().toISOString().split("T")[0],
    deliveryDate: "",
    statut: "En cours",
    shippingAddress: "",
    shippingCharges: 0,
    avance: 0,
    discount: 0,
    discountType: "%",
    note: "",
    sousTotal: "",
    total: "",
  });

  const [isArticleDialogOpen, setIsArticleDialogOpen] = useState(false);
  const router = useRouter();

  const getCommandeById = async () => {
    const result = await axios.get(`/api/commandes/${params.id}`);
    const { commande } = result.data;
    setCommande(commande);
    setItems(commande.commandeProduits);
    setClient(commande.client);
    setFormData((prev) => ({
      ...prev,
      numero: commande?.numero,
      customerName: commande?.client.nom,
      shippingCharges: commande?.fraisLivraison,
      discount: commande?.reduction,
      statut: commande?.statut,
      discountType: commande?.typeReduction,
      note: commande?.note,
      avance: commande?.avance,
      produits: commande?.commandeProduits,
    }));
    setDate(commande?.echeance);
    setIsLoading(false);
    console.log("commandeProduits : ", commande.commandeProduits);
    console.log("commande : ", commande);
  };
  useEffect(() => {
    getCommandeById();
  }, [params.id]);

  const generateDevisNumber = () => {
    if (devi) {
      return `CMD-${devi?.numero.slice(4, 13)}`;
    } else {
      const digits = "1234567890";
      const nanoidCustom = customAlphabet(digits, 8);

      const customId = nanoidCustom();

      return `CMD-${customId}`;
    }
  };
  const generateClientId = () => {
    if (devi) {
      return devi.client.id;
    } else {
      return client.id;
    }
  };

  useEffect(() => {
    if (devi) {
      setFormData((prev) => ({
        ...prev,
        note: devi?.note,
        shippingCharges: devi?.fraisLivraison,
        discount: devi?.reduction,
        discountType: devi?.typeReduction,
      }));
    }
  }, [devi]);

  const onSubmit = () => {
    const data = {
      id:commande.id,
      clientId: generateClientId(),
      //deviNum: formData.deviNum,
      produits: items,
      numero: generateDevisNumber(),
      echeance: date,
      statut: formData.statut,
      fraisLivraison: parseFloat(formData.shippingCharges),
      reduction: parseInt(formData.discount),
      typeReduction: formData.discountType,
      avance: parseInt(formData.avance),
      note: formData.note,
      sousTotal: parseFloat(calculateSubTotal().toFixed(2)),
      total: parseFloat(calculateTotal()),
    };
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
        setFormData((prev) => ({
          ...prev,
          clientId: "",
          deviNum: "",
          produits: items,
          numero: "",
          echeance: "",
          statut: "",
          shippingCharges: 0,
          discount: 0,
          discountType: "%",
          avance: 0,
          note: "",
          sousTotal: 0,
          total: 0,
        }));
        setDevi("");
        setItems([]);

        console.log("Commande modifier avec succès");
      })(),
      {
        loading: "Ajout du commande ...",
        success: "Commande modifier avec succès!",
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
  const getClients = async () => {
    const result = await axios.get("/api/clients");
    const { Clients } = result.data;
    setClientList(Clients);
  };

  const filteredClients = useMemo(() => {
    return clientList.filter((client) =>
      client.nom.toLowerCase().includes(searchClientQuery.toLowerCase())
    );
  }, [clientList, searchClientQuery]);

  useEffect(() => {
    getClients();
  }, []);
  const getDevisCommandes = async () => {
    const result1 = await axios.get("/api/devis");
    const result2 = await axios.get("/api/commandes");
    const { devis } = result1.data;
    const { commandes } = result2.data;
    // devisList sont les devis sans commandes
    const devisList = devis?.filter(
      (devi) =>
        !commandes?.some(
          (commande) =>
            commande.numero.slice(4, 13) === devi.numero.slice(4, 13)
        )
    );
    setDevisList(devisList);
  };

  useEffect(() => {
    getDevisCommandes();
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
            <h1 className="text-3xl font-bold mr-2">Modifier une commande</h1>
            {isLoading && <LoadingDots size={7}/>}
          </div>
         
        </div>

        <Card>
          <CardContent className="p-6 space-y-6">
            {/* Header Section */}
            <div className="grid grid-cols-4 items-center gap-6">
              <div className="col-span-2">
                <Label htmlFor="statut" className="text-right text-black">
                  Numéro de commande
                </Label>
                <Input
                  className="font-bold mt-2"
                  value={formData.numero}
                  disabled
                />
              </div>
              <div className="col-span-2">
                <Label htmlFor="statut" className="text-right text-black">
                  Client
                </Label>
                <Input
                  className="font-bold mt-2"
                  value={formData.customerName}
                  disabled
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-6">
              <div className="col-span-1">
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
                            value={item.designation}
                            onChange={(e) =>
                              handleItemChange(
                                item.id,
                                "designation",
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
            <Button onClick={() => router.push("/ventes/commandes")} className="rounded-full" variant="outline">
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
