"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import toast, { Toaster } from "react-hot-toast";
import CustomPagination from "@/components/customUi/customPagination";
import CustomTooltip from "@/components/customUi/customTooltip";
import { deleteManyFactures } from "@/app/api/actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { LoadingDots } from "@/components/loading-dots";
import { Search, Plus, X, Pen, Trash2 } from "lucide-react";
import { AddFactureVarianteForm } from "@/components/add-facture-variante-form";
import { DeleteConfirmationDialog } from "@/components/delete-confirmation-dialog";
import { DeleteManyConfirmation } from "@/components/delete-many-confirmation";
import { UpdateDepenseVariante } from "@/components/update-depense-variante";
import axios from "axios";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
type Facture = {
  date: Date;
  numero: string;
  id: string;
  label: string;
  montant: number;
  type: string;
  payer: boolean;
  description: string;
  compte: string;
};
function Page() {
  const [searchQuery, setSearchQuery] = useState("");
  const [currfacture, setCurrFacture] = useState<Facture | undefined>();
  const [currentPage, setCurrentPage] = useState(1);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isManyDialogOpen, setIsManyDialogOpen] = useState(false);
  const [isAddingfacture, setIsAddingfacture] = useState(false);
  const [isUpdatingfacture, setIsUpdatingfacture] = useState(false);
  const [page, setPage] = useState(1);
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [totalPages, setTotalPages] = useState();
  const [selectedFactures, setSelectedFactures] = useState<Set<string>>(
    new Set()
  );

  const queryClient = useQueryClient();
  const factures = useQuery({
    queryKey: ["depensesVariantes", page, debouncedQuery],
    queryFn: async () => {
      const response = await axios.get("/api/depensesVariantes", {
        params: {
          query: debouncedQuery,
          page,
        },
      });
      setTotalPages(response.data.totalPages);
      return response.data.factures;
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

  const handleDeleteMany = useMutation({
    mutationFn: async (selectedFactures: Set<string>) => {
      const loadingToast = toast.loading("Suppression des factures...");
      try {
        await deleteManyFactures(Array.from(selectedFactures));
        toast.success("Suppression effecuter avec succès");
      } catch (error) {
        toast.error("Échec de la suppression!");
        throw error;
      } finally {
        toast.dismiss(loadingToast);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["factures"] });
    },
  });

  const deleteFacture = useMutation({
    mutationFn: async () => {
      const loadingToast = toast.loading("Suppression de la facture...");
      try {
        const response = await axios.delete(`/api/depensesVariantes`, {
          params: { id: currfacture?.id, numero: currfacture?.numero },
        });
        toast(
          <span>
            La facture <b>{currfacture?.label.toUpperCase()}</b> a été supprimé
            avec succès!
          </span>,
          {
            icon: "🗑️",
          }
        );
        return response.data;
      } catch (error) {
        toast.error("Échec de la suppression de la facture");
        throw error;
      } finally {
        toast.dismiss(loadingToast);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["depensesVariantes"] });
    },
  });
  return (
    <>
      <Toaster position="top-center" />
      <div className="space-y-6">
        <div className="flex justify-start gap-2 items-center">
          <span className="text-3xl font-bold">Dépenses variantes </span>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0 sm:space-x-4 mb-6 ">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Recherche..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-full rounded-full bg-gray-50 focus-visible:ring-purple-500 focus-visible:ring-offset-0"
              spellCheck={false}
            />
            <div className="absolute right-6 top-1/3 h-4 w-4 -translate-y-1/2 text-muted-foreground">
              {factures.isFetching && !factures.isLoading && <LoadingDots />}
            </div>
          </div>

          <Button
            onClick={() => {
              setIsAddingfacture(!isAddingfacture);
              if (isUpdatingfacture) {
                setIsUpdatingfacture(false);
                setIsAddingfacture(false);
              }
              setSelectedFactures(new Set());
            }}
            className={`${
              isAddingfacture || isUpdatingfacture
                ? "bg-red-500 hover:bg-red-600"
                : "bg-gradient-to-r from-fuchsia-500 via-purple-500 to-violet-500 hover:bg-purple-600 "
            } text-white font-semibold transition-all duration-300 transform hover:scale-105 rounded-full`}
          >
            {isAddingfacture || isUpdatingfacture ? (
              <>
                <X className="mr-2 h-4 w-4" />
                Annuler
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Ajouter une facture
              </>
            )}
          </Button>
        </div>

        <div
          className={`grid ${
            isAddingfacture || isUpdatingfacture
              ? "grid-cols-3 gap-6"
              : "grid-cols-1"
          }`}
        >
          <div className="col-span-2">
            <div
              className={`grid gap-3 border mb-3 rounded-lg ${
                isAddingfacture || isUpdatingfacture ? "hidden" : ""
              } `}
            >
              {/* the full table  */}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Numéro</TableHead>
                    <TableHead>Label</TableHead>
                    <TableHead>Montant</TableHead>
                    <TableHead>Compte</TableHead>
                    <TableHead className="w-[600px] truncate">
                      Description
                    </TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {factures.isLoading ? (
                    [...Array(10)].map((_, index) => (
                      <TableRow
                        className="h-[2rem] MuiTableRow-root"
                        role="checkbox"
                        tabIndex={-1}
                        key={index}
                      >
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
                            <Skeleton className="h-7 w-7 rounded-full" />
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : factures.data?.length > 0 ? (
                    factures.data?.map((facture: Facture) => (
                      <TableRow key={facture.id}>
                         <TableCell className="text-md font-semibold">
                          {facture.numero}
                        </TableCell>
                        <TableCell className="text-md font-semibold">
                          {facture.label}
                        </TableCell>
                        <TableCell className="text-md">
                          {facture.montant} DH
                        </TableCell>
                        <TableCell className="text-md">
                          {facture.compte}
                        </TableCell>
                        <TableCell className="text-md">
                          {facture.description}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <CustomTooltip message="Modifier">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 rounded-full hover:bg-purple-100 hover:text-purple-600"
                                onClick={() => {
                                  setCurrFacture(facture);
                                  setIsUpdatingfacture(true);
                                  setIsAddingfacture(false);
                                }}
                              >
                                <Pen className="h-4 w-4" />
                              </Button>
                            </CustomTooltip>
                            <CustomTooltip message="Supprimer">
                              <Button
                                name="delete btn"
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 rounded-full hover:bg-red-100 hover:text-red-600"
                                onClick={() => {
                                  setIsDialogOpen(true);
                                  setCurrFacture(facture);
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </CustomTooltip>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        Aucune facture trouvé
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {/* the half table with the facture , statut de paiement , montant and actions columns */}
            <ScrollArea
              className={`h-[35rem] w-full  grid gap-3  border mb-3 rounded-lg ${
                !isAddingfacture && !isUpdatingfacture ? "hidden" : ""
              } `}
            >
              <div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Facture</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {factures.isLoading ? (
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
                            <div className="flex gap-2 items-center">
                              <Skeleton className="h-12 w-12 rounded-full" />
                              <Skeleton className="h-4 w-[150px]" />
                            </div>
                          </TableCell>
                          <TableCell className="!py-2" align="right">
                            <Skeleton className="h-4 w-[100px]" />
                          </TableCell>
                        </TableRow>
                      ))
                    ) : factures.data?.length > 0 ? (
                      factures.data?.map((facture: Facture) => (
                        <TableRow key={facture.id}>
                          <TableCell className="font-medium cursor-pointer hover:text-purple-600">
                            <div className="flex flex-row gap-2 justify-start items-center">
                              <div className="grid grid-rows-2">
                                <h1>{facture.label.toUpperCase()}</h1>
                                <p className="text-sm text-muted-foreground">
                                  {facture.montant} DH
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <CustomTooltip message="Modifier">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 rounded-full hover:bg-purple-100 hover:text-purple-600"
                                  onClick={() => {
                                    setCurrFacture(facture);
                                    setIsUpdatingfacture(true);
                                    setIsAddingfacture(false);
                                  }}
                                >
                                  <Pen className="h-4 w-4" />
                                </Button>
                              </CustomTooltip>
                              <CustomTooltip message="Supprimer">
                                <Button
                                  name="delete btn"
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 rounded-full hover:bg-red-100 hover:text-red-600"
                                  onClick={() => {
                                    setIsDialogOpen(true);
                                    setCurrFacture(facture);
                                  }}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </CustomTooltip>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={3} align="center">
                          Aucune facture trouvé
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </ScrollArea>
            {factures.data?.length > 0 ? (
              <CustomPagination
                currentPage={currentPage}
                setCurrentPage={setCurrentPage}
                totalPages={totalPages}
              />
            ) : (
              ""
            )}
          </div>
          <div className={`${!isUpdatingfacture && "hidden"} `}>
            <ScrollArea className="w-full h-[75vh]">
              {isUpdatingfacture && (
                <UpdateDepenseVariante
                  currFacture={currfacture}
                  setIsUpdatingfacture={setIsUpdatingfacture}
                />
              )}
            </ScrollArea>
          </div>
          <div className={`${!isAddingfacture && "hidden"} `}>
            <ScrollArea className="w-full h-[75vh]">
              {isAddingfacture && <AddFactureVarianteForm />}
            </ScrollArea>
          </div>
        </div>
      </div>
      <DeleteConfirmationDialog
        recordName={currfacture?.label}
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onConfirm={() => {
          deleteFacture.mutate();
          setIsDialogOpen(false);
        }}
      ></DeleteConfirmationDialog>
      <DeleteManyConfirmation
        isOpen={isManyDialogOpen}
        onClose={() => setIsManyDialogOpen(false)}
        onConfirm={() => {
          handleDeleteMany.mutate(selectedFactures);
          setIsManyDialogOpen(false);
        }}
      ></DeleteManyConfirmation>
    </>
  );
}

export default Page;
