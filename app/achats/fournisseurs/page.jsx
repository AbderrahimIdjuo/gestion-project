"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
import { ModifyFournisseurDialog } from "@/components/modify-fournisseur-dialog ";
import { DeleteConfirmationDialog } from "@/components/delete-confirmation-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Search, Plus, Pen, Trash2 } from "lucide-react";
import { FournisseurFormDialog } from "@/components/fournisseur-form-dialog";
import { Skeleton } from "@/components/ui/skeleton";

export default function FournisseursPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [currFournisseur, setCurrFournisseur] = useState("");
  const [fournisseurList, setFournisseurList] = useState([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const itemsPerPage = 10;

  const filteredFournisseurs = fournisseurList.filter(
    (fournisseur) =>
      searchQuery === "" ||
      fournisseur.nom.toLowerCase().includes(searchQuery.toLowerCase()) ||
      fournisseur.telephone.toLowerCase().includes(searchQuery.toLowerCase()) ||
      fournisseur.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      fournisseur.adresse.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.ceil(filteredFournisseurs.length / itemsPerPage);
  const currentFournisseurs = filteredFournisseurs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const getFournisseurs = async () => {
    const result = await axios.get("/api/fournisseurs");
    const { Fournisseurs } = result.data;
    setFournisseurList(Fournisseurs);
    setIsLoading(false);
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  useEffect(() => {
    getFournisseurs();
  }, []);

  const deleteFournisseur = async () => {
    try {
      await axios.delete(`/api/fournisseurs/${currFournisseur.id}`);
      toast(
        <span>
          Le fournisseur <b>{currFournisseur?.nom.toUpperCase()}</b> a été
          supprimé avec succès!
        </span>,
        {
          icon: "🗑️",
        }
      );

      getFournisseurs();
    } catch (e) {
      console.log(e);
    }
  };

  return (
    <>
      <Toaster position="top-center" />
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
            <FournisseurFormDialog getFournisseurs={getFournisseurs}>
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
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                [...Array(10)].map((_, index) => (
                  <TableRow
                    className="h-[2rem] MuiTableRow-root"
                    hover
                    role="checkbox"
                    tabIndex={-1}
                    key={index}
                  >
                    <TableCell
                      className="!py-2 text-sm md:text-base"
                      key={index}
                      align="left"
                    >
                      <Skeleton className="h-4 w-[150px]" />
                    </TableCell>
                    <TableCell className="!py-2" key={index} align="left">
                      <Skeleton className="h-4 w-[150px]" />
                    </TableCell>
                    <TableCell className="!py-2" key={index} align="left">
                      <Skeleton className="h-4 w-[150px]" />
                    </TableCell>
                    <TableCell className="!py-2" key={index} align="left">
                      <Skeleton className="h-4 w-[150px]" />
                    </TableCell>
                    <TableCell className="!py-2" key={index} align="right">
                      <Skeleton className="h-4 w-[100px]" />
                    </TableCell>
                  </TableRow>
                ))
              ) : currentFournisseurs?.length > 0 ? (
                currentFournisseurs.map((fournisseur) => (
                  <TableRow key={fournisseur.id}>
                    <TableCell className="font-medium">
                      {fournisseur.nom}
                    </TableCell>
                    <TableCell>{fournisseur.email}</TableCell>
                    <TableCell>{fournisseur.telephone}</TableCell>
                    <TableCell>{fournisseur.adresse}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <ModifyFournisseurDialog
                          currFournisseur={currFournisseur}
                          getFournisseurs={getFournisseurs}
                        >
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-full hover:bg-purple-100 hover:text-purple-600"
                            onClick={() => {
                              setCurrFournisseur(fournisseur);
                            }}
                          >
                            <Pen className="h-4 w-4" />
                            <span className="sr-only">Modifier</span>
                          </Button>
                        </ModifyFournisseurDialog>
                        <Button
                          name="delete btn"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-full hover:bg-red-100 hover:text-red-600"
                          onClick={() => {
                            setIsDialogOpen(true);
                            setCurrFournisseur(fournisseur);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Supprimer</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableCell colSpan={7} align="center">
                  Aucun fournisseur trouvé
                </TableCell>
              )}
            </TableBody>
          </Table>
        </div>
        {filteredFournisseurs?.length > 0 ? (
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
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
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        ) : null}
      </div>
      <DeleteConfirmationDialog
        recordName={currFournisseur?.nom}
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onConfirm={() => {
          deleteFournisseur();
          setIsDialogOpen(false);
          getFournisseurs();
        }}
        itemType="client"
      ></DeleteConfirmationDialog>
    </>
  );
}
