"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Plus, Trash2 } from "lucide-react";
import { ArticleSelectionDialog } from "@/components/produits-selection-dialog";

export default function NouvelleCommandePage() {
  const [items, setItems] = useState([
    { id: 1, details: "", quantity: 1, rate: 0, discount: 0, tax: 0 },
  ]);
  const [formData, setFormData] = useState({
    customerName: "",
    orderNumber:
      "CMD-" + String(Math.floor(Math.random() * 100000)).padStart(6, "0"),
    reference: "",
    orderDate: new Date().toISOString().split("T")[0],
    deliveryDate: "",
    status: "",
    shippingAddress: "",
    shippingCharges: 0,
    discount: 0,
    discountType: "%",
    notes: "",
  });

  const [isArticleDialogOpen, setIsArticleDialogOpen] = useState(false);

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

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Form Data:", { ...formData, items });
    // Here you would typically send the data to your backend
  };

  return (
    <div className="container mx-auto py-6 space-y-6 max-w-5xl">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Nouvelle Commande</h1>
        <div className="space-x-2">
          <Button variant="outline">Annuler</Button>
          <Button
            onClick={handleSubmit}
            className="bg-gradient-to-r from-fuchsia-500 via-purple-500 to-violet-500 text-white"
          >
            Enregistrer
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-6 space-y-6">
          {/* Header Section */}
          <div className="grid grid-cols-2 gap-6">
            
            <div className="space-y-1">
                <Label htmlFor="orderNumber">Client</Label>
                <Input
                  id="orderNumber"
                  name="orderNumber"
                  value="Oujdi Abderrahim"
                  onChange={handleInputChange}
                  disabled
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="orderNumber">Numéro du devi</Label>
                <Input
                  id="orderNumber"
                  name="orderNumber"
                  value={formData.orderNumber}
                  onChange={handleInputChange}
                  disabled
                />
              </div>
            </div>
          

          <div className="space-y-2">
            <Label htmlFor="status">Statut</Label>
            <Select
              value={formData.status}
              onValueChange={(value) =>
                handleInputChange({ target: { name: "status", value } })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="En cours">En cours</SelectItem>
                <SelectItem value="Expédiée">Expédiée</SelectItem>
                <SelectItem value="Livrée">Livrée</SelectItem>
                <SelectItem value="Annulée">Annulée</SelectItem>
              </SelectContent>
            </Select>
          </div>



          {/* Items Table */}
          <div className="space-y-4">
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
                          handleItemChange(item.id, "details", e.target.value)
                        }
                        placeholder="Description de l'article"
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
                        className="w-20"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={item.rate}
                        onChange={(e) =>
                          handleItemChange(
                            item.id,
                            "rate",
                            Number(e.target.value)
                          )
                        }
                        className="w-24"
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

            <Button
              variant="outline"
              onClick={() => setIsArticleDialogOpen(true)}
              className="flex items-center gap-2 bg-gradient-to-r from-fuchsia-500 via-purple-500 to-violet-500 text-white"
            >
              <Plus className="h-4 w-4" />
              Ajouter un article
            </Button>
            <ArticleSelectionDialog
              open={isArticleDialogOpen}
              onOpenChange={setIsArticleDialogOpen}
              onArticlesAdd={handleAddArticles}
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
                    <div className="absolute bg-slate-100 inset-y-0 right-0 w-12 flex items-center justify-center  border-l rounded-r-md">
                      <span className="text-sm  text-gray-800">MAD</span>
                    </div>
                    <Input
                      id="shippingCharges"
                      name="shippingCharges"
                      value={formData.shippingCharges}
                      onChange={handleInputChange}
                      className="pr-14 text-left rounded-r-md"
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
                        className="w-40 pr-[60px]"
                      />
                      <Select
                        value={formData.discountType}
                        onValueChange={(value) =>
                          handleInputChange({
                            target: { name: "discountType", value },
                          })
                        }
                      >
                        <SelectTrigger className="absolute right-0 w-[80px] rounded-l-none border-l-0  focus:ring-0">
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
    </div>
  );
}
