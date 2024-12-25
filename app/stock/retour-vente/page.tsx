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
import { Plus, Search, Filter, Pen, Trash2 } from 'lucide-react'
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
const retours = Array.from({ length: 50 }, (_, i) => ({
  id: i + 1,
  date: new Date(2024, 0, i + 1).toLocaleDateString('fr-FR'),
  article: `Article ${i + 1}`,
  stockAvant: Math.floor(Math.random() * 1000),
  prixAchat: (Math.random() * 100 + 50).toFixed(2),
  quantite: Math.floor(Math.random() * 20) + 1,
  prixTTC: 0,
})).map(retour => ({
  ...retour,
  prixTTC: (parseFloat(retour.prixAchat) * retour.quantite * 1.2).toFixed(2), // 20% TVA
}))

export default function RetourVentePage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [filters, setFilters] = useState({
    dateStart: '',
    dateEnd: '',
    article: '',
    stockMin: 0,
    stockMax: 1000,
    prixMin: 0,
    prixMax: 200,
  })
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [retourToDelete, setRetourToDelete] = useState<number | null>(null)
  const itemsPerPage = 10

  const filteredRetours = retours.filter(retour =>
    (searchQuery === '' || 
     retour.article.toLowerCase().includes(searchQuery.toLowerCase()) ||
     retour.date.includes(searchQuery)) &&
    (filters.article === '' || retour.article.toLowerCase().includes(filters.article.toLowerCase())) &&
    (retour.stockAvant >= filters.stockMin && retour.stockAvant <= filters.stockMax) &&
    (parseFloat(retour.prixAchat) >= filters.prixMin && parseFloat(retour.prixAchat) <= filters.prixMax) &&
    (!filters.dateStart || new Date(retour.date) >= new Date(filters.dateStart)) &&
    (!filters.dateEnd || new Date(retour.date) <= new Date(filters.dateEnd))
  )

  const totalPages = Math.ceil(filteredRetours.length / itemsPerPage)
  const currentRetours = filteredRetours.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const handleEdit = (id: number) => {
    console.log('Edit retour:', id)
  }

  const handleDelete = (id: number) => {
    setRetourToDelete(id)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = () => {
    if (retourToDelete) {
      console.log('Deleting retour:', retourToDelete)
      // Actual delete logic here
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Retour de vente</h1>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0 sm:space-x-4 mb-6">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Rechercher des retours..."
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
                  Ajustez les filtres pour affiner votre recherche de retours.
                </SheetDescription>
              </SheetHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="dateStart" className="text-right text-black">
                    Date début
                  </Label>
                  <Input
                    id="dateStart"
                    type="date"
                    value={filters.dateStart}
                    onChange={(e) => setFilters({ ...filters, dateStart: e.target.value })}
                    className="col-span-3 border-purple-200 bg-white focus:ring-purple-500"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="dateEnd" className="text-right text-black">
                    Date fin
                  </Label>
                  <Input
                    id="dateEnd"
                    type="date"
                    value={filters.dateEnd}
                    onChange={(e) => setFilters({ ...filters, dateEnd: e.target.value })}
                    className="col-span-3 border-purple-200 bg-white focus:ring-purple-500"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="article" className="text-right text-black">
                    Article
                  </Label>
                  <Input
                    id="article"
                    value={filters.article}
                    onChange={(e) => setFilters({ ...filters, article: e.target.value })}
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
            Nouveau Retour
          </Button>
        </div>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Article</TableHead>
              <TableHead>Stock Avant</TableHead>
              <TableHead>Prix d'achat</TableHead>
              <TableHead>Quantité</TableHead>
              <TableHead>Prix TTC</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentRetours.map((retour) => (
              <TableRow key={retour.id}>
                <TableCell>{retour.date}</TableCell>
                <TableCell className="font-medium">{retour.article}</TableCell>
                <TableCell>{retour.stockAvant}</TableCell>
                <TableCell>{retour.prixAchat} €</TableCell>
                <TableCell>{retour.quantite}</TableCell>
                <TableCell>{retour.prixTTC} €</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-full hover:bg-purple-100 hover:text-purple-600"
                      onClick={() => handleEdit(retour.id)}
                    >
                      <Pen className="h-4 w-4" />
                      <span className="sr-only">Modifier</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-full hover:bg-red-100 hover:text-red-600"
                      onClick={() => handleDelete(retour.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Supprimer</span>
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
        itemType="retour de vente"
      />
    </div>
  )
}

