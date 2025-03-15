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
import CustomPagination from "@/components/customUi/customPagination";
import { Search, Plus, Pen, Trash2, X } from "lucide-react";
import { FournisseurFormDialog } from "@/components/fournisseur-form-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LoadingDots } from "@/components/loading-dots";
import { useQuery, useQueryClient } from "@tanstack/react-query";

export default function FournisseursPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [currFournisseur, setCurrFournisseur] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAddingFournisseur, setIsAddingFournisseur] = useState(false);
  const [isUpdatingFournisseur, setIsUpdatingFournisseur] = useState(false);
  const [page, setPage] = useState(1);
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [totalPages, setTotalPages] = useState();

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
                {fournisseurs.isFetching && !fournisseurs.isLoading && <LoadingDots />}
              </div>
            </div>

          <div className="flex space-x-2">
            {/* Botton d'ajout de fournisseur */}
            <Button
              onClick={() => {
                setIsAddingFournisseur(!isAddingFournisseur);
                if (isUpdatingFournisseur) {
                  setIsUpdatingFournisseur(false);
                  setIsAddingFournisseur(false);
                }
              }}
              className={`${
                isAddingFournisseur || isUpdatingFournisseur
                  ? "bg-red-500 hover:bg-red-600"
                  : "bg-gradient-to-r from-fuchsia-500 via-purple-500 to-violet-500 hover:bg-purple-600 "
              } text-white font-semibold transition-all duration-300 transform hover:scale-105 rounded-full`}
            >
              {isAddingFournisseur || isUpdatingFournisseur ? (
                <>
                  <X className="mr-2 h-4 w-4" />
                  Annuler
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Nouveau Fournisseur
                </>
              )}
            </Button>
          </div>
        </div>

        <div
          className={`grid ${
            isAddingFournisseur || isUpdatingFournisseur
              ? "grid-cols-3 gap-6"
              : "grid-cols-1"
          }`}
        >
          <div className="col-span-2">
            <div
              className={`grid gap-3 border mb-3 rounded-lg ${
                isAddingFournisseur || isUpdatingFournisseur ? "hidden" : ""
              } `}
            >
              {/* the full table  */}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
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
                      <TableRow
                        className="font-medium hover:text-emerald-400"
                        key={fournisseur.id}
                      >
                        <TableCell className="font-medium cursor-pointer !py-2">
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
                                setCurrFournisseur(fournisseur);
                                setIsUpdatingFournisseur(true);
                                setIsAddingFournisseur(false);
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

            {/* the half table with the name and Action columns */}
            <ScrollArea
              className={`h-[35rem] w-full  grid gap-3  border mb-3 rounded-lg ${
                !isAddingFournisseur && !isUpdatingFournisseur ? "hidden" : ""
              } `}
            >
              <div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fournisseur</TableHead>

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
                        <TableRow key={fournisseur.id}>
                          <TableCell className="font-medium cursor-pointer hover:text-purple-600">
                            <div className="flex flex-row gap-2 justify-start items-center">
                              <Avatar className="w-10 h-10">
                                <AvatarImage
                                  src={`https://api.dicebear.com/7.x/initials/svg?seed=${fournisseur.nom}`}
                                />
                                <AvatarFallback>
                                  {getInitials(fournisseur.nom)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="grid grid-rows-2">
                                <h2 className="text-sm font-bold">
                                  {fournisseur.nom.toUpperCase()}
                                </h2>

                                <p className="text-sm text-muted-foreground">
                                  {fournisseur.telephone}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 rounded-full hover:bg-purple-100 hover:text-purple-600"
                                onClick={() => {
                                  setCurrFournisseur(fournisseur);
                                  setIsUpdatingFournisseur(true);
                                  setIsAddingFournisseur(false);
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
            </ScrollArea>
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
          <div className={`${!isUpdatingFournisseur && "hidden"} `}>
            <ScrollArea className="w-full h-[85vh]">
              {isUpdatingFournisseur && (
                <ModifyFournisseurDialog
                  currFournisseur={currFournisseur}
                  fournisseurList={fournisseurs.data}
                />
              )}
            </ScrollArea>
          </div>
          <div className={`${!isAddingFournisseur && "hidden"} `}>
            <ScrollArea className="w-full h-[85vh]">
              {isAddingFournisseur && (
                <FournisseurFormDialog
                  fournisseurList={fournisseurs.data}
                />
              )}
            </ScrollArea>
          </div>
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
    </>
  );
}
