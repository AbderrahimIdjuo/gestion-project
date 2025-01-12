"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function ClientFormInline() {
  const [formData, setFormData] = useState({
    nom: "",
    email: "",
    telephone: "",
    adresse: "",
    entreprise: "",
    credit: "",
  })

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    console.log("Nouveau client:", formData)
    // Here you would typically send the data to your backend
    setFormData({ nom: "", email: "", telephone: "", adresse: "", entreprise: "", credit: "" })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="nom">Nom</Label>
        <Input
          id="nom"
          name="nom"
          value={formData.nom}
          onChange={handleInputChange}
          className="focus-visible:ring-purple-300 focus-visible:ring-offset-0"
        />
      </div>
      <div>
        <Label  htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleInputChange}
          className="focus-visible:ring-purple-300 focus-visible:ring-offset-0"
        />
      </div>
      <div>
        <Label htmlFor="telephone">Téléphone</Label>
        <Input
          id="telephone"
          name="telephone"
          type="tel"
          value={formData.telephone}
          onChange={handleInputChange}
          className="focus-visible:ring-purple-300 focus-visible:ring-offset-0"
        />
      </div>
      <div>
        <Label htmlFor="adresse">Adresse</Label>
        <Input
          id="adresse"
          name="adresse"
          value={formData.adresse}
          onChange={handleInputChange}
          className="focus-visible:ring-purple-300 focus-visible:ring-offset-0"
        />
      </div>
      <div>
        <Label htmlFor="entreprise">Entreprise (optionnel)</Label>
        <Input
          id="entreprise"
          name="entreprise"
          value={formData.entreprise}
          onChange={handleInputChange}
          className="focus-visible:ring-purple-300 focus-visible:ring-offset-0"
        />
      </div>
      <div>
        <Label htmlFor="credit">Crédit (optionnel)</Label>
        <Input
          id="credit"
          name="credit"
          type="number"
          value={formData.credit}
          onChange={handleInputChange}
          className="focus-visible:ring-purple-300 focus-visible:ring-offset-0"
        />
      </div>
      <Button type="submit" className="bg-[#4ade80] hover:bg-[#22c55e] text-white w-full">
        Ajouter le client
      </Button>
    </form>
  )
}

