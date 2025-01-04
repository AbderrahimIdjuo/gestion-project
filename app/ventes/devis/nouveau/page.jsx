"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
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
import { Plus, Trash2 ,MoveLeftIcon } from "lucide-react";

export default function NouveauDevisPage() {
  const [items, setItems] = useState([
    { id: 1, details: "", quantity: 1, rate: 0, discount: 0, tax: 0 },
  ]);
  const [formData, setFormData] = useState({
    customerName: "",
    quoteNumber:
      "DN-" + String(Math.floor(Math.random() * 100000)).padStart(6, "0"),
    reference: "",
    quoteDate: new Date().toISOString().split("T")[0],
    expiryDate: "",
    salesperson: "",
    projectName: "",
    subject: "",
    shippingCharges: 0,
    discount: 0,
    discountType: "%",
    customerNotes: "Looking forward for your business.",
  });
  const router = useRouter()

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
        details: "",
        quantity: 1,
        rate: 0,
        discount: 0,
        tax: 0,
      },
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
<div className="flex gap-3 items-center">
<Button className="rounded-full " size="icon" variant="ghost" onClick={() => router.push('/ventes/devis')}>
<MoveLeftIcon/>
</Button>
<h1 className="text-3xl font-bold">Nouveau Devis</h1>
</div>
        <div className="space-x-2">
          <Button variant="outline">Annuler</Button>
          <Button
            onClick={handleSubmit}
            className="bg-gradient-to-r from-fuchsia-500 via-purple-500 to-violet-500 hover:bg-purple-600 hover:scale-105 text-white hover:!text-white font-semibold transition-all duration-300 transform"
          >
            Enregistrer
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-6 space-y-6">
          {/* Header Section */}
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="customerName">Client*</Label>
                <Select
                  value={formData.customerName}
                  onValueChange={(value) =>
                    handleInputChange({
                      target: { name: "customerName", value },
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un client" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="client1">Client 1</SelectItem>
                    <SelectItem value="client2">Client 2</SelectItem>
                    <SelectItem value="client3">Client 3</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
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
                      MAD
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
              className="bg-gradient-to-r from-fuchsia-500 via-purple-500 to-violet-500 hover:bg-purple-600 hover:scale-105 text-white hover:!text-white font-semibold transition-all duration-300 transform"
            >
              <Plus className="h-4 w-4" />
              Ajouter un article
            </Button>
          </div>

          {/* Totals Section */}
          <div className="space-y-4 bg-purple-50 p-4 rounded-lg">
            <div className="space-y-4">
              <div className="flex justify-between py-2 border-b">
                <span>Sous-total</span>
                <span>{calculateSubTotal().toFixed(2)} MAD</span>
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
                      //type="number"
                      value={formData.shippingCharges}
                      onChange={handleInputChange}
                      className="pr-14 text-right rounded-r-md"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="discount">Remise</Label>
                  <div className="flex items-center">
                    <div className="relative flex items-center">
                      <Input
                        id="discount"
                        name="discount"
                        //type="number"
                        value={formData.discount}
                        onChange={handleInputChange}
                        className="w-40 pr-[70px]"
                      />
                      <Select
                        value={formData.discountType}
                        onValueChange={(value) =>
                          handleInputChange({
                            target: { name: "discountType", value },
                          })
                        }
                      >
                        <SelectTrigger className="absolute right-0 w-[80px] rounded-l-none border-l-0 focus:ring-0">
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
    </div>
  );
}
