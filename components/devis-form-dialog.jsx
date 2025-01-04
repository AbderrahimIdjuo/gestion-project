"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function DevisFormDialog({ children }) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    client: "",
    date: "",
    montant: "",
    statut: "",
    validite: "",
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Nouveau devis:", formData);
    // Here you would typically send the data to your backend
    setOpen(false);
    setFormData({
      client: "",
      date: "",
      montant: "",
      statut: "",
      validite: "",
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Ajouter un nouveau devis</DialogTitle>
          <DialogDescription>
            Remplissez les informations du nouveau devis ici. Cliquez sur
            enregistrer lorsque vous avez terminé.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="client" className="text-right">
                Client
              </Label>
              <Input
                id="client"
                name="client"
                value={formData.client}
                onChange={handleInputChange}
                className="col-span-3 focus-visible:ring-purple-300 focus-visible:ring-offset-0"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="date" className="text-right">
                Date
              </Label>
              <Input
                id="date"
                name="date"
                type="date"
                value={formData.date}
                onChange={handleInputChange}
                className="col-span-3 focus-visible:ring-purple-300 focus-visible:ring-offset-0"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="montant" className="text-right">
                Montant
              </Label>
              <Input
                id="montant"
                name="montant"
                type="number"
                value={formData.montant}
                onChange={handleInputChange}
                className="col-span-3 focus-visible:ring-purple-300 focus-visible:ring-offset-0"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="statut" className="text-right">
                Statut
              </Label>
              <Select
                name="statut"
                onValueChange={(value) => handleSelectChange("statut", value)}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Sélectionnez un statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="En attente">En attente</SelectItem>
                  <SelectItem value="Accepté">Accepté</SelectItem>
                  <SelectItem value="Refusé">Refusé</SelectItem>
                  <SelectItem value="Expiré">Expiré</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="validite" className="text-right">
                Validité
              </Label>
              <Input
                id="validite"
                name="validite"
                type="date"
                value={formData.validite}
                onChange={handleInputChange}
                className="col-span-3 focus-visible:ring-purple-300 focus-visible:ring-offset-0"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="submit"
              className="bg-[#4ade80] hover:bg-[#22c55e] text-white"
            >
              Enregistrer
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
