'use client'

import { useState, useEffect } from 'react'
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
import { Plus, Search, Pen, Trash2, Info, Filter } from 'lucide-react'
import { ProductFormDialog } from '@/components/product-form-dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
import { DeleteConfirmationDialog } from "@/components/delete-confirmation-dialog"

// Mock data
const products = Array.from({ length: 50 }, (_, i) => ({
  id: i + 1,
  nom: `Produit ${i + 1}`,
  categorie: ['Électronique', 'Vêtements', 'Alimentation', 'Bureautique'][i % 4],
  prixAchat: Math.floor(Math.random() * 900) + 100,
  prixVente: Math.floor(Math.random() * 1500) + 200,
  description: `Description du produit ${i + 1}`,
  status: ['En stock', 'Rupture', 'Commander'][i % 3],
  stock: Math.floor(Math.random() * 100),
}))

export default function ProduitsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [filters, setFilters] = useState({
    categorie: 'all',
    status: 'all',
    prixAchat: [0, 1000],
    prixVente: [0, 1500],
    stock: [0, 100],
  })
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [productToDelete, setProductToDelete] = useState<number | null>(null)
  const itemsPerPage = 10

  const filteredProducts = products.filter(product =>
    (searchQuery === '' || product.nom.toLowerCase().includes(searchQuery.toLowerCase())) &&
    (filters.categorie === 'all' || product.categorie === filters.categorie) &&
    (filters.status === 'all' || product.status === filters.status) &&
    (product.prixAchat >= filters.prixAchat[0] && product.prixAchat <= filters.prixAchat[1]) &&
    (product.prixVente >= filters.prixVente[0] && product.prixVente <= filters.prixVente[1]) &&
    (product.stock >= filters.stock[0] && product.stock <= filters.stock[1])
  )

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage)
  const currentProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  useEffect(() => {
    setCurrentPage(1)
  }, [filters, searchQuery])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'En stock':
        return 'bg-emerald-500'
      case 'Rupture':
        return 'bg-red-500'
      case 'Commander':
        return 'bg-amber-500'
      default:
        return 'bg-gray-500'
    }
  }

  const handleEdit = (id: number) => {
    console.log('Edit product:', id)
  }

  const handleDelete = (id: number) => {
    setProductToDelete(id)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = () => {
    if (productToDelete) {
      console.log('Deleting product:', productToDelete)
      // Actual delete logic here
    }
  }

  const handleDetails = (id: number) => {
    console.log('View details for product:', id)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Produits</h1>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0 sm:space-x-4 mb-6">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Rechercher des produits..."
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
                  Ajustez les filtres pour affiner votre recherche de produits.
                </SheetDescription>
              </SheetHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="categorie" className="text-right text-black">
                    Catégorie
                  </Label>
                  <Select
                    value={filters.categorie}
                    onValueChange={(value) => setFilters({ ...filters, categorie: value })}
                  >
                    <SelectTrigger className="col-span-3 border-purple-200 bg-white focus:ring-purple-500">
                      <SelectValue placeholder="Toutes les catégories" />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      <SelectItem value="all">Toutes les catégories</SelectItem>
                      <SelectItem value="Électronique">Électronique</SelectItem>
                      <SelectItem value="Vêtements">Vêtements</SelectItem>
                      <SelectItem value="Alimentation">Alimentation</SelectItem>
                      <SelectItem value="Bureautique">Bureautique</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="status" className="text-right text-black">
                    Statut
                  </Label>
                  <Select
                    value={filters.status}
                    onValueChange={(value) => setFilters({ ...filters, status: value })}
                  >
                    <SelectTrigger className="col-span-3 border-purple-200 bg-white focus:ring-purple-500">
                      <SelectValue placeholder="Tous les statuts" />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      <SelectItem value="all">Tous les statuts</SelectItem>
                      <SelectItem value="En stock">En stock</SelectItem>
                      <SelectItem value="Rupture">Rupture</SelectItem>
                      <SelectItem value="Commander">Commander</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="prixAchat" className="text-right text-black">
                    Prix d'achat
                  </Label>
                  <div className="col-span-3">
                    <Slider
                      min={0}
                      max={1000}
                      step={10}
                      value={filters.prixAchat}
                      onValueChange={(value) => setFilters({ ...filters, prixAchat: value })}
                      className="w-full [&_[role=slider]]:bg-purple-500 [&_[role=slider]]:border-purple-500 [&_[role=slider]]:focus:ring-purple-500 [&_[role=track]]:bg-purple-100 [&_[role=range]]:bg-purple-300"
                    />
                    <div className="flex justify-between mt-2">
                      <span>{filters.prixAchat[0]}€</span>
                      <span>{filters.prixAchat[1]}€</span>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="prixVente" className="text-right text-black">
                    Prix de vente
                  </Label>
                  <div className="col-span-3">
                    <Slider
                      min={0}
                      max={1500}
                      step={10}
                      value={filters.prixVente}
                      onValueChange={(value) => setFilters({ ...filters, prixVente: value })}
                      className="w-full [&_[role=slider]]:bg-purple-500 [&_[role=slider]]:border-purple-500 [&_[role=slider]]:focus:ring-purple-500 [&_[role=track]]:bg-purple-100 [&_[role=range]]:bg-purple-300"
                    />
                    <div className="flex justify-between mt-2">
                      <span>{filters.prixVente[0]}€</span>
                      <span>{filters.prixVente[1]}€</span>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="stock" className="text-right text-black">
                    Stock
                  </Label>
                  <div className="col-span-3">
                    <Slider
                      min={0}
                      max={100}
                      step={1}
                      value={filters.stock}
                      onValueChange={(value) => setFilters({ ...filters, stock: value })}
                      className="w-full [&_[role=slider]]:bg-purple-500 [&_[role=slider]]:border-purple-500 [&_[role=slider]]:focus:ring-purple-500 [&_[role=track]]:bg-purple-100 [&_[role=range]]:bg-purple-300"
                    />
                    <div className="flex justify-between mt-2">
                      <span>{filters.stock[0]}</span>
                      <span>{filters.stock[1]}</span>
                    </div>
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>
          <ProductFormDialog>
            <Button className="bg-gradient-to-r from-fuchsia-500 via-purple-500 to-violet-500 hover:bg-purple-600 hover:scale-105 text-white font-semibold transition-all duration-300 transform">
              <Plus className="mr-2 h-4 w-4" />
              Nouveau Produit
            </Button>
          </ProductFormDialog>
        </div>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nom</TableHead>
              <TableHead>Catégorie</TableHead>
              <TableHead>Prix d'achat</TableHead>
              <TableHead>Prix de vente</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentProducts.map((product) => (
              <TableRow key={product.id}>
                <TableCell className="font-medium">{product.nom}</TableCell>
                <TableCell>{product.categorie}</TableCell>
                <TableCell>{product.prixAchat.toFixed(2)} €</TableCell>
                <TableCell>{product.prixVente.toFixed(2)} €</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${getStatusColor(product.status)}`} />
                    <span className="text-sm text-muted-foreground">
                      {product.status}
                    </span>
                  </div>
                </TableCell>
                <TableCell>{product.stock}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-full hover:bg-purple-100 hover:text-purple-600"
                      onClick={() => handleEdit(product.id)}
                    >
                      <Pen className="h-4 w-4" />
                      <span className="sr-only">Modifier</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-full hover:bg-red-100 hover:text-red-600"
                      onClick={() => handleDelete(product.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Supprimer</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-full hover:bg-blue-100 hover:text-blue-600"
                      onClick={() => handleDetails(product.id)}
                    >
                      <Info className="h-4 w-4" />
                      <span className="sr-only">Détails</span>
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
        itemType="produit"
      />
    </div>
  )
}

