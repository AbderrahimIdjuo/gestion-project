"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface ProductFormDialogProps {
  children: React.ReactNode
}

export function ProductFormDialog({ children }: ProductFormDialogProps) {
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState({
    nom: "",
    categorie: "",
    prixAchat: "",
    prixVente: "",
    description: "",
    status: "",
    stock: "",
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log("Nouveau produit:", formData)
    // Here you would typically send the data to your backend
    setOpen(false)
    setFormData({ nom: "", categorie: "", prixAchat: "", prixVente: "", description: "", status: "", stock: "" })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Ajouter un nouveau produit</DialogTitle>
          <DialogDescription>
            Remplissez les informations du nouveau produit ici. Cliquez sur enregistrer lorsque vous avez terminé.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="nom" className="text-right">
                Nom
              </Label>
              <Input
                id="nom"
                name="nom"
                value={formData.nom}
                onChange={handleInputChange}
                className="col-span-3 focus-visible:ring-purple-300 focus-visible:ring-offset-0"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="categorie" className="text-right">
                Catégorie
              </Label>
              <Select name="categorie" onValueChange={(value) => handleSelectChange("categorie", value)}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Sélectionnez une catégorie" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Électronique">Électronique</SelectItem>
                  <SelectItem value="Vêtements">Vêtements</SelectItem>
                  <SelectItem value="Alimentation">Alimentation</SelectItem>
                  <SelectItem value="Bureautique">Bureautique</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="prixAchat" className="text-right">
                Prix d'achat
              </Label>
              <Input
                id="prixAchat"
                name="prixAchat"
                type="number"
                value={formData.prixAchat}
                onChange={handleInputChange}
                className="col-span-3 focus-visible:ring-purple-300 focus-visible:ring-offset-0"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="prixVente" className="text-right">
                Prix de vente
              </Label>
              <Input
                id="prixVente"
                name="prixVente"
                type="number"
                value={formData.prixVente}
                onChange={handleInputChange}
                className="col-span-3 focus-visible:ring-purple-300 focus-visible:ring-offset-0"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Description
              </Label>
              <Input
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                className="col-span-3 focus-visible:ring-purple-300 focus-visible:ring-offset-0"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="status" className="text-right">
                Statut
              </Label>
              <Select name="status" onValueChange={(value) => handleSelectChange("status", value)}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Sélectionnez un statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="En stock">En stock</SelectItem>
                  <SelectItem value="Rupture">Rupture</SelectItem>
                  <SelectItem value="Commander">Commander</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="stock" className="text-right">
                Stock
              </Label>
              <Input
                id="stock"
                name="stock"
                type="number"
                value={formData.stock}
                onChange={handleInputChange}
                className="col-span-3 focus-visible:ring-purple-300 focus-visible:ring-offset-0"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" className="bg-[#4ade80] hover:bg-[#22c55e] text-white">Enregistrer</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

