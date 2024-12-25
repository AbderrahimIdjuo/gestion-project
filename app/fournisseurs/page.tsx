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
import { Search, Plus } from 'lucide-react'
import { FournisseurFormDialog } from '@/components/fournisseur-form-dialog'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Label } from "@/components/ui/label"

// Mock data
const fournisseurs = Array.from({ length: 50 }, (_, i) => ({
  id: i + 1,
  nom: `Fournisseur ${i + 1}`,
  email: `fournisseur${i + 1}@example.com`,
  telephone: `+1234567${i.toString().padStart(4, '0')}`,
  adresse: `${i + 1} Rue Fournisseur, Ville`,
}))

export default function FournisseursPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [filters, setFilters] = useState({
    nom: '',
    email: '',
    telephone: '',
  })
  const itemsPerPage = 10

  const filteredFournisseurs = fournisseurs.filter(fournisseur =>
    (searchQuery === '' || 
     fournisseur.nom.toLowerCase().includes(searchQuery.toLowerCase()) ||
     fournisseur.email.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const totalPages = Math.ceil(filteredFournisseurs.length / itemsPerPage)
  const currentFournisseurs = filteredFournisseurs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  useEffect(() => {
    setCurrentPage(1)
  }, [filters, searchQuery])

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Fournisseurs</h1>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0 sm:space-x-4 mb-6">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Rechercher des fournisseurs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 w-full rounded-full bg-gray-50 focus-visible:ring-purple-500 focus-visible:ring-offset-0"
          />
        </div>
        <div className="flex space-x-2">
          <FournisseurFormDialog>
            <Button className="bg-gradient-to-r from-fuchsia-500 via-purple-500 to-violet-500 hover:bg-purple-600 hover:scale-105 text-white font-semibold transition-all duration-300 transform">
              <Plus className="mr-2 h-4 w-4" />
              Nouveau Fournisseur
            </Button>
          </FournisseurFormDialog>
        </div>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nom</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Téléphone</TableHead>
              <TableHead>Adresse</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentFournisseurs.map((fournisseur) => (
              <TableRow key={fournisseur.id}>
                <TableCell className="font-medium">{fournisseur.nom}</TableCell>
                <TableCell>{fournisseur.email}</TableCell>
                <TableCell>{fournisseur.telephone}</TableCell>
                <TableCell>{fournisseur.adresse}</TableCell>
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

