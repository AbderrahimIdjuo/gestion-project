"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
import { ModifyFournisseur } from "@/components/modify-fournisseur-dialog";
import { DeleteConfirmationDialog } from "@/components/delete-confirmation-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import CustomPagination from "@/components/customUi/customPagination";
import { Search, Trash2, Upload, CircleDollarSign, Pen } from "lucide-react";
import { FournisseurFormDialog } from "@/components/fournisseur-form-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LoadingDots } from "@/components/loading-dots";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import ImportFournisseurs from "@/components/importer-fournisseur";
import PaiementFournisseurDialog from "@/components/paiement-fournisseur";
import InfosFournisseurDialog from "@/components/infos-fournisseur-dialog";
export default function FournisseursPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [currFournisseur, setCurrFournisseur] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [isInfosDialogOpen, setIsInfosDialogOpen] = useState(false);

  const [page, setPage] = useState(1);
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [totalPages, setTotalPages] = useState();
  const [paiementDialogOpen, setPaiementDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  const fournisseurs = useQuery({
    queryKey: ["fournisseurs", page, debouncedQuery],
    queryFn: async () => {
      const response = await axios.get("/api/fournisseurs", {
        params: {
          query: debouncedQuery,
          page,
        },
      });
      setTotalPages(response.data.totalPages);
      return response.data.fournisseurs;
    },
    keepPreviousData: true, // Keeps old data visible while fetching new page
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery);
      setPage(1);
    }, 500); // Adjust delay as needed

    return () => {
      clearTimeout(handler);
    };
  }, [searchQuery]);

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
      queryClient.invalidateQueries(["fournisseurs"]);
    } catch (e) {
      console.log(e);
    }
  };
  const getInitials = (name) => {
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase();
  };

  return (
    <>
      <Toaster position="top-center" />
      <div className="space-y-6 mb-[5rem]">
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
              spellCheck={false}
            />
            <div className="absolute right-6 top-1/3 h-4 w-4 -translate-y-1/2 text-muted-foreground">
              {fournisseurs.isFetching && !fournisseurs.isLoading && (
                <LoadingDots />
              )}
            </div>
          </div>

          <div className="flex space-x-2">
            <ImportFournisseurs>
              <Button
                variant="outline"
                className="border-purple-500 bg-purple-100 text-purple-700 hover:bg-purple-200 hover:text-purple-900 rounded-full"
              >
                <Upload className="mr-2 h-4 w-4" />
                Importer
              </Button>
            </ImportFournisseurs>
            <FournisseurFormDialog />
          </div>
        </div>

        <div className="col-span-2">
          <div className="border mb-3 rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Dette</TableHead>
                  <TableHead>ICE</TableHead>
                  <TableHead>Téléphone</TableHead>
                  <TableHead>Adresse</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fournisseurs.isLoading ? (
                  [...Array(10)].map((_, index) => (
                    <TableRow
                      className="h-[2rem] MuiTableRow-root"
                      role="checkbox"
                      tabIndex={-1}
                      key={index}
                    >
                      <TableCell
                        className="!py-2 text-sm md:text-base"
                        align="left"
                      >
                        <Skeleton className="h-4 w-[150px]" />
                      </TableCell>
                      <TableCell className="!py-2" align="left">
                        <Skeleton className="h-4 w-[150px]" />
                      </TableCell>
                      <TableCell className="!py-2" align="left">
                        <Skeleton className="h-4 w-[150px]" />
                      </TableCell>
                      <TableCell className="!py-2" align="left">
                        <Skeleton className="h-4 w-[150px]" />
                      </TableCell>
                      <TableCell className="!py-2" align="left">
                        <Skeleton className="h-4 w-[150px]" />
                      </TableCell>
                      <TableCell className="!py-2" align="left">
                        <Skeleton className="h-4 w-[150px]" />
                      </TableCell>
                      <TableCell className="!py-2">
                        <div className="flex gap-2 justify-end">
                          <Skeleton className="h-7 w-7 rounded-full" />
                          <Skeleton className="h-7 w-7 rounded-full" />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : fournisseurs.data?.length > 0 ? (
                  fournisseurs.data.map((fournisseur) => (
                    <TableRow className="font-medium " key={fournisseur.id}>
                      <TableCell
                        onClick={() => {
                          setIsInfosDialogOpen(true);
                          setCurrFournisseur(fournisseur);
                        }}
                        className="font-medium hover:text-purple-500 cursor-pointer !py-2"
                      >
                        <div className="flex flex-row gap-2 justify-start items-center">
                          <Avatar className="w-10 h-10">
                            <AvatarImage
                              src={`https://api.dicebear.com/7.x/initials/svg?seed=${fournisseur.nom}`}
                            />
                            <AvatarFallback>
                              {getInitials(fournisseur.nom)}
                            </AvatarFallback>
                          </Avatar>
                          <h2 className="text-sm font-bold">
                            {fournisseur.nom.toUpperCase()}
                          </h2>
                        </div>
                      </TableCell>
                      <TableCell className="text-md !py-2">
                        {fournisseur.dette} DH
                      </TableCell>
                      <TableCell className="text-md !py-2">
                        {fournisseur.ice}
                      </TableCell>
                      <TableCell className="text-md !py-2">
                        {fournisseur.telephone}
                      </TableCell>
                      <TableCell className="text-md !py-2">
                        {fournisseur.adresse}
                      </TableCell>
                      <TableCell className="text-md !py-2">
                        {fournisseur.email}
                      </TableCell>
                      <TableCell className="text-right !py-2">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-full hover:bg-purple-100 hover:text-purple-600"
                            onClick={() => {
                              setIsUpdateDialogOpen(true);
                              setCurrFournisseur(fournisseur);
                            }}
                          >
                            <Pen className="h-4 w-4" />
                            <span className="sr-only">Modifier</span>
                          </Button>

                          <Button
                            name="delete btn"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-full hover:bg-red-100 hover:text-red-600"
                            onClick={() => {
                              setCurrFournisseur(fournisseur);
                              setIsDialogOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Supprimer</span>
                          </Button>
                          <Button
                            name="paiement btn"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-full hover:bg-green-100 hover:text-green-600"
                            onClick={() => {
                              setPaiementDialogOpen(true);
                              setCurrFournisseur(fournisseur);
                            }}
                          >
                            <CircleDollarSign className="h-4 w-4" />
                            <span className="sr-only">paiement </span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableCell colSpan={7} align="center">
                    <div className="text-center py-10 text-muted-foreground">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className="size-14 mx-auto mb-4 opacity-50"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m5.231 13.481L15 17.25m-4.5-15H5.625c-.621 0-1.125.504-1.125 1.125v16.5c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Zm3.75 11.625a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z"
                        />
                      </svg>
                      <p>Aucun fournisseur trouvé</p>
                    </div>
                  </TableCell>
                )}
              </TableBody>
            </Table>
          </div>
          {fournisseurs.data?.length > 0 ? (
            <CustomPagination
              currentPage={page}
              setCurrentPage={setPage}
              totalPages={totalPages}
            />
          ) : (
            ""
          )}
        </div>
      </div>
      <DeleteConfirmationDialog
        recordName={currFournisseur?.nom}
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onConfirm={() => {
          deleteFournisseur();
          setIsDialogOpen(false);
          queryClient.invalidateQueries(["fournisseurs"]);
        }}
        itemType="fournisseur"
      ></DeleteConfirmationDialog>
      <PaiementFournisseurDialog
        fournisseur={currFournisseur}
        isOpen={paiementDialogOpen}
        onClose={() => setPaiementDialogOpen(false)}
      />
      <ModifyFournisseur
        currFournisseur={currFournisseur}
        isOpen={isUpdateDialogOpen}
        onClose={() => setIsUpdateDialogOpen(false)}
      />

      <InfosFournisseurDialog
        fournisseur={currFournisseur}
        isOpen={isInfosDialogOpen}
        onClose={() => setIsInfosDialogOpen(false)}
      />
    </>
  );
}
