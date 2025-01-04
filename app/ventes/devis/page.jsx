'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useRouter } from 'next/navigation'
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



// Mock data
const devis = Array.from({ length: 50 }, (_, i) => ({
  id: `DEV-${(i + 1).toString().padStart(4, '0')}`,
  client: `Client ${i + 1}`,
  date: new Date(2024, 0, i + 1).toLocaleDateString('fr-FR'),
  montant: Math.floor(Math.random() * 10000) + 100,
  statut: ['En attente', 'Accepté', 'Refusé', 'Expiré'][i % 4],
  validite: new Date(2024, 1, i + 1).toLocaleDateString('fr-FR'),
}))

export default function DevisPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [filters, setFilters] = useState({
    client: 'all',
    dateStart: '',
    dateEnd: '',
    montant: [0, 10000],
    statut: 'all',
  })
  const itemsPerPage = 10

  const filteredDevis = devis.filter(devis =>
    (searchQuery === '' || devis.id.toLowerCase().includes(searchQuery.toLowerCase()) || devis.client.toLowerCase().includes(searchQuery.toLowerCase())) &&
    (filters.client === 'all' || devis.client === filters.client) &&
    (filters.statut === 'all' || devis.statut === filters.statut) &&
    (devis.montant >= filters.montant[0] && devis.montant <= filters.montant[1]) &&
    (!filters.dateStart || !filters.dateEnd || (new Date(devis.date) >= new Date(filters.dateStart) && new Date(devis.date) <= new Date(filters.dateEnd)))
  )

  const totalPages = Math.ceil(filteredDevis.length / itemsPerPage)
  const currentDevis = filteredDevis.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )
  const router = useRouter()
  useEffect(() => {
    setCurrentPage(1)
  }, [filters, searchQuery])

  const getStatusColor = (status) => {
    switch (status) {
      case 'En attente':
        return 'bg-blue-500'
      case 'Accepté':
        return 'bg-emerald-500'
      case 'Refusé':
        return 'bg-red-500'
      case 'Expiré':
        return 'bg-gray-500'
      default:
        return 'bg-gray-500'
    }
  }

  const handleEdit = (id) => {
    console.log('Edit devis:', id)
  }

  const handleDelete = (id) => {
    console.log('Delete devis:', id)
  }

  const handleInfo = (id) => {
    console.log('View info for devis:', id)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Devis</h1>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0 sm:space-x-4 mb-6">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Rechercher des devis..."
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
                  Ajustez les filtres pour affiner votre recherche de devis.
                </SheetDescription>
              </SheetHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="client" className="text-right text-black">
                    Client
                  </Label>
                  <Select
                    value={filters.client}
                    onValueChange={(value) => setFilters({ ...filters, client: value })}
                  >
                    <SelectTrigger className="col-span-3 border-purple-200 bg-white focus:ring-purple-500">
                      <SelectValue placeholder="Tous les clients" />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      <SelectItem value="all">Tous les clients</SelectItem>
                      {Array.from(new Set(devis.map(d => d.client))).map(client => (
                        <SelectItem key={client} value={client}>{client}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
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
                  <Label htmlFor="montant" className="text-right text-black">
                    Montant
                  </Label>
                  <div className="col-span-3">
                    <Slider
                      min={0}
                      max={10000}
                      step={100}
                      value={filters.montant}
                      onValueChange={(value) => setFilters({ ...filters, montant: value })}
                      className="w-full [&_[role=slider]]:bg-purple-500 [&_[role=slider]]:border-purple-500 [&_[role=slider]]:focus:ring-purple-500 [&_[role=track]]:bg-purple-100 [&_[role=range]]:bg-purple-300"
                    />
                    <div className="flex justify-between mt-2">
                      <span>{filters.montant[0]}€</span>
                      <span>{filters.montant[1]}€</span>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="statut" className="text-right text-black">
                    Statut
                  </Label>
                  <Select
                    value={filters.statut}
                    onValueChange={(value) => setFilters({ ...filters, statut: value })}
                  >
                    <SelectTrigger className="col-span-3 border-purple-200 bg-white focus:ring-purple-500">
                      <SelectValue placeholder="Tous les statuts" />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      <SelectItem value="all">Tous les statuts</SelectItem>
                      <SelectItem value="En attente">En attente</SelectItem>
                      <SelectItem value="Accepté">Accepté</SelectItem>
                      <SelectItem value="Refusé">Refusé</SelectItem>
                      <SelectItem value="Expiré">Expiré</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        
            <Button onClick={() => router.push('/ventes/devis/nouveau')}
          className="bg-gradient-to-r from-fuchsia-500 via-purple-500 to-violet-500 hover:bg-purple-600 hover:scale-105 text-white font-semibold transition-all duration-300 transform">
              <Plus className="mr-2 h-4 w-4" />
              Nouveau Devis
            </Button>
          
        </div>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Numéro</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Montant</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Validité</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentDevis.map((devis) => (
              <TableRow key={devis.id}>
                <TableCell className="font-medium">{devis.id}</TableCell>
                <TableCell>{devis.client}</TableCell>
                <TableCell>{devis.date}</TableCell>
                <TableCell>{devis.montant.toFixed(2)} €</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${getStatusColor(devis.statut)}`} />
                    <span className="text-sm text-muted-foreground">
                      {devis.statut}
                    </span>
                  </div>
                </TableCell>
                <TableCell>{devis.validite}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-full hover:bg-purple-100 hover:text-purple-600"
                      onClick={() => handleEdit(devis.id)}
                    >
                      <Pen className="h-4 w-4" />
                      <span className="sr-only">Modifier</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-full hover:bg-red-100 hover:text-red-600"
                      onClick={() => handleDelete(devis.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Supprimer</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-full hover:bg-blue-100 hover:text-blue-600"
                      onClick={() => handleInfo(devis.id)}
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
    </div>
  )
}

