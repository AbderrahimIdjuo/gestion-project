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
const achats = Array.from({ length: 50 }, (_, i) => ({
  id: i + 1,
  produit: `Produit ${i + 1}`,
  stockActuel: Math.floor(Math.random() * 1000),
  prixAchat: (Math.random() * 100).toFixed(2),
  quantite: Math.floor(Math.random() * 100) + 1,
  prixTotal: 0,
  prixTTC: 0,
})).map(achat => ({
  ...achat,
  prixTotal: (parseFloat(achat.prixAchat) * achat.quantite).toFixed(2),
  prixTTC: (parseFloat(achat.prixAchat) * achat.quantite * 1.2).toFixed(2), // Assuming 20% tax
}))

export default function AchatPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [filters, setFilters] = useState({
    produit: '',
    stockMin: 0,
    stockMax: 1000,
    prixMin: 0,
    prixMax: 100,
  })
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [achatToDelete, setAchatToDelete] = useState<number | null>(null)
  const itemsPerPage = 10

  const filteredAchats = achats.filter(achat =>
    (searchQuery === '' || achat.produit.toLowerCase().includes(searchQuery.toLowerCase())) &&
    (filters.produit === '' || achat.produit.toLowerCase().includes(filters.produit.toLowerCase())) &&
    (achat.stockActuel >= filters.stockMin && achat.stockActuel <= filters.stockMax) &&
    (parseFloat(achat.prixAchat) >= filters.prixMin && parseFloat(achat.prixAchat) <= filters.prixMax)
  )

  const totalPages = Math.ceil(filteredAchats.length / itemsPerPage)
  const currentAchats = filteredAchats.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const handleEdit = (id: number) => {
    console.log('Edit achat:', id)
  }

  const handleDelete = (id: number) => {
    setAchatToDelete(id)
    setDeleteDialogOpen(true)
  }

  const handleInfo = (id: number) => {
    console.log('View info for achat:', id)
  }

  const confirmDelete = () => {
    if (achatToDelete) {
      console.log('Deleting achat:', achatToDelete)
      // Actual delete logic here
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Achats</h1>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0 sm:space-x-4 mb-6">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Rechercher des achats..."
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
                  Ajustez les filtres pour affiner votre recherche d'achats.
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
                    Prix d'achat
                  </Label>
                  <div className="col-span-3">
                    <Slider
                      min={0}
                      max={100}
                      step={1}
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
            Nouveau Achat
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
              <TableHead>Quantité</TableHead>
              <TableHead>Prix Total</TableHead>
              <TableHead>Prix TTC</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentAchats.map((achat) => (
              <TableRow key={achat.id}>
                <TableCell className="font-medium">{achat.produit}</TableCell>
                <TableCell>{achat.stockActuel}</TableCell>
                <TableCell>{achat.prixAchat} €</TableCell>
                <TableCell>{achat.quantite}</TableCell>
                <TableCell>{achat.prixTotal} €</TableCell>
                <TableCell>{achat.prixTTC} €</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-full hover:bg-purple-100 hover:text-purple-600"
                      onClick={() => handleEdit(achat.id)}
                    >
                      <Pen className="h-4 w-4" />
                      <span className="sr-only">Modifier</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-full hover:bg-red-100 hover:text-red-600"
                      onClick={() => handleDelete(achat.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Supprimer</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-full hover:bg-blue-100 hover:text-blue-600"
                      onClick={() => handleInfo(achat.id)}
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
            />
          </PaginationItem>
          {Array.from({ length: totalPages }, (_, i) => (
            <PaginationItem key={i + 1}>
              <PaginationLink
                onClick={() => setCurrentPage(i + 1)}
                isActive={currentPage === i + 1}
              >
                {i + 1}
              </PaginationLink>
            </PaginationItem>
          ))}
          <PaginationItem>
            <PaginationNext
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
      <DeleteConfirmationDialog
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={confirmDelete}
        itemType="achat"
      />
    </div>
  )
}

