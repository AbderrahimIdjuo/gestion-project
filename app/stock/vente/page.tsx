'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import { Plus, Search, Filter, Pen, Trash2, Info } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { DeleteConfirmationDialog } from "@/components/delete-confirmation-dialog"

// Mock data
const ventes = Array.from({ length: 50 }, (_, i) => ({
  id: i + 1,
  produit: `Produit ${i + 1}`,
  stockActuel: Math.floor(Math.random() * 1000),
  prixAchat: (Math.random() * 50 + 10).toFixed(2),
  prixVente: (Math.random() * 100 + 50).toFixed(2),
  quantite: Math.floor(Math.random() * 50) + 1,
  prixTotal: 0,
  prixTTC: 0,
  marge: 0,
})).map(vente => {
  const prixTotal = (parseFloat(vente.prixVente) * vente.quantite).toFixed(2);
  const prixTTC = (parseFloat(prixTotal) * 1.2).toFixed(2); // Assuming 20% tax
  const marge = (parseFloat(prixTotal) - (parseFloat(vente.prixAchat) * vente.quantite)).toFixed(2);
  return { ...vente, prixTotal, prixTTC, marge };
})

export default function VentePage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [filters, setFilters] = useState({
    produit: '',
    stockMin: 0,
    stockMax: 1000,
    prixMin: 0,
    prixMax: 200,
  })
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [venteToDelete, setVenteToDelete] = useState<number | null>(null)
  const itemsPerPage = 10

  const filteredVentes = ventes.filter(vente =>
    (searchQuery === '' || vente.produit.toLowerCase().includes(searchQuery.toLowerCase())) &&
    (filters.produit === '' || vente.produit.toLowerCase().includes(filters.produit.toLowerCase())) &&
    (vente.stockActuel >= filters.stockMin && vente.stockActuel <= filters.stockMax) &&
    (parseFloat(vente.prixVente) >= filters.prixMin && parseFloat(vente.prixVente) <= filters.prixMax)
  )

  const totalPages = Math.ceil(filteredVentes.length / itemsPerPage)
  const currentVentes = filteredVentes.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const handleDelete = (id: number) => {
    setVenteToDelete(id)
    setDeleteDialogOpen(true)
  }

  const handleEdit = (id: number) => {
    console.log('Edit vente:', id)
  }

  const handleInfo = (id: number) => {
    console.log('View info for vente:', id)
  }

  const confirmDelete = () => {
    if (venteToDelete) {
      console.log('Deleting vente:', venteToDelete)
      // Actual delete logic here
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Ventes</h1>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0 sm:space-x-4 mb-6">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Rechercher des ventes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 w-full rounded-full bg-gray-50 focus-visible:ring-purple-500 focus-visible:ring-offset-0"
          />
        </div>
        <div className="flex space-x-2">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" className="border-purple-500 bg-purple-100 text-purple-700 hover:bg-purple-200 hover:text-purple-900">
                <Filter className="mr-2 h-4 w-4" />
                Filtres
              </Button>
            </SheetTrigger>
            <SheetContent className="border-l-purple-200 bg-white">
              <SheetHeader>
                <SheetTitle className="text-black">Filtres</SheetTitle>
                <SheetDescription className="text-gray-600">
                  Ajustez les filtres pour affiner votre recherche de ventes.
                </SheetDescription>
              </SheetHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="produit" className="text-right text-black">
                    Produit
                  </Label>
                  <Input
                    id="produit"
                    value={filters.produit}
                    onChange={(e) => setFilters({ ...filters, produit: e.target.value })}
                    className="col-span-3 border-purple-200 bg-white focus:ring-purple-500"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="stock" className="text-right text-black">
                    Stock
                  </Label>
                  <div className="col-span-3">
                    <Slider
                      min={0}
                      max={1000}
                      step={10}
                      value={[filters.stockMin, filters.stockMax]}
                      onValueChange={(value) => setFilters({ ...filters, stockMin: value[0], stockMax: value[1] })}
                      className="w-full [&_[role=slider]]:bg-purple-500 [&_[role=slider]]:border-purple-500 [&_[role=slider]]:focus:ring-purple-500 [&_[role=track]]:bg-purple-100 [&_[role=range]]:bg-purple-300"
                    />
                    <div className="flex justify-between mt-2">
                      <span>{filters.stockMin}</span>
                      <span>{filters.stockMax}</span>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="prix" className="text-right text-black">
                    Prix de vente
                  </Label>
                  <div className="col-span-3">
                    <Slider
                      min={0}
                      max={200}
                      step={5}
                      value={[filters.prixMin, filters.prixMax]}
                      onValueChange={(value) => setFilters({ ...filters, prixMin: value[0], prixMax: value[1] })}
                      className="w-full [&_[role=slider]]:bg-purple-500 [&_[role=slider]]:border-purple-500 [&_[role=slider]]:focus:ring-purple-500 [&_[role=track]]:bg-purple-100 [&_[role=range]]:bg-purple-300"
                    />
                    <div className="flex justify-between mt-2">
                      <span>{filters.prixMin}€</span>
                      <span>{filters.prixMax}€</span>
                    </div>
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>
          <Button className="bg-gradient-to-r from-fuchsia-500 via-purple-500 to-violet-500 hover:bg-purple-600 hover:scale-105 text-white font-semibold transition-all duration-300 transform">
            <Plus className="mr-2 h-4 w-4" />
            Nouvelle Vente
          </Button>
        </div>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Produit</TableHead>
              <TableHead>Stock Actuel</TableHead>
              <TableHead>Prix d'achat (par unité)</TableHead>
              <TableHead>Prix de vente (par unité)</TableHead>
              <TableHead>Quantité</TableHead>
              <TableHead>Prix Total</TableHead>
              <TableHead>Prix TTC</TableHead>
              <TableHead>Marge</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentVentes.map((vente) => (
              <TableRow key={vente.id}>
                <TableCell className="font-medium">{vente.produit}</TableCell>
                <TableCell>{vente.stockActuel}</TableCell>
                <TableCell>{vente.prixAchat} €</TableCell>
                <TableCell>{vente.prixVente} €</TableCell>
                <TableCell>{vente.quantite}</TableCell>
                <TableCell>{vente.prixTotal} €</TableCell>
                <TableCell>{vente.prixTTC} €</TableCell>
                <TableCell>{vente.marge} €</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-full hover:bg-purple-100 hover:text-purple-600"
                      onClick={() => handleEdit(vente.id)}
                    >
                      <Pen className="h-4 w-4" />
                      <span className="sr-only">Modifier</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-full hover:bg-red-100 hover:text-red-600"
                      onClick={() => handleDelete(vente.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Supprimer</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-full hover:bg-blue-100 hover:text-blue-600"
                      onClick={() => handleInfo(vente.id)}
                    >
                      <Info className="h-4 w-4" />
                      <span className="sr-only">Informations</span>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious 
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="rounded-full"
            />
          </PaginationItem>
          {Array.from({ length: totalPages }, (_, i) => (
            <PaginationItem key={i + 1}>
              <PaginationLink
                onClick={() => setCurrentPage(i + 1)}
                isActive={currentPage === i + 1}
                className="rounded-full"
              >
                {i + 1}
              </PaginationLink>
            </PaginationItem>
          ))}
          <PaginationItem>
            <PaginationNext
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="rounded-full"
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
      <DeleteConfirmationDialog
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={confirmDelete}
        itemType="vente"
      />
    </div>
  )
}

