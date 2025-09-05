"use client";

import CreateFactureDialog from "@/components/create-facture-dialog";
import CustomDateRangePicker from "@/components/customUi/customDateRangePicker";
import CustomPagination from "@/components/customUi/customPagination";
import { PriceRangeSlider } from "@/components/customUi/customSlider";
import CustomTooltip from "@/components/customUi/customTooltip";
import { DeleteConfirmationDialog } from "@/components/delete-confirmation-dialog";
import { LoadingDots } from "@/components/loading-dots";
import { Navbar } from "@/components/navbar";
import { Sidebar } from "@/components/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import UpdateFactureDialog from "@/components/update-facture-dialog";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { Filter, Pen, Printer, Search, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import toast, { Toaster } from "react-hot-toast";

function formatDate(dateString) {
  return dateString?.split("T")[0].split("-").reverse().join("-");
}
export default function Factures() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false); // Delete dialog
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [currFacture, setCurrFacture] = useState("");
  const [maxMontant, setMaxMontant] = useState();
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [startDate, setStartDate] = useState();
  const [endDate, setEndDate] = useState();
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState();
  const queryClient = useQueryClient();

  const [filters, setFilters] = useState({
    categorie: "all",
    statut: "all",
    statutPaiement: "all",
    montant: [0, maxMontant],
  });

  useEffect(() => {
    setFilters(prev => ({
      ...prev,
      montant: [0, maxMontant],
    }));
  }, [maxMontant]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery);
      setPage(1);
    }, 500); // Adjust delay as needed

    return () => {
      clearTimeout(handler);
    };
  }, [searchQuery]);

  const factures = useQuery({
    queryKey: [
      "factures",
      filters.statut,
      debouncedQuery,
      page,
      startDate,
      endDate,
      filters.montant,
      filters.categorie,
      filters.statutPaiement,
    ],
    queryFn: async () => {
      // Les dates viennent déjà au format ISO string UTC depuis le DateRangePicker
      const response = await axios.get("/api/factures", {
        params: {
          query: debouncedQuery,
          page,
          statut: filters.statut,
          from: startDate, // Utilisation directe
          to: endDate, // Utilisation directe
          minTotal: filters.montant[0],
          maxTotal: filters.montant[1],
          categorie: encodeURIComponent(filters.categorie),
          statutPaiement: filters.statutPaiement,
        },
      });
      console.log("factures", response.data.factures);
      setMaxMontant(response.data.maxMontant);
      setTotalPages(response.data.totalPages);
      return response.data.factures;
    },
    keepPreviousData: true, // Keeps old data visible while fetching new page
    reflechOnWindowFocus: false,
  });

  const deleteFacture = useMutation({
    mutationFn: async () => {
      const loadingToast = toast.loading("Suppression...");
      try {
        await axios.delete(`/api/factures/${currFacture.id}`);
        toast(
          <span>
            La facture numéro : <b>{currFacture?.numero.toUpperCase()}</b> a été
            supprimé avec succès!
          </span>,
          {
            icon: "🗑️",
          }
        );
      } catch (error) {
        console.log("error :", error);
        toast.error("Échec de la suppression");
        throw error;
      } finally {
        toast.dismiss(loadingToast);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["factures"]);
    },
  });

  return (
    <>
      <Toaster position="top-center" />
      <div className="flex flex-col h-screen">
        {/* Navbar - prend toute la largeur */}
        <Navbar />

        {/* Container principal avec sidebar et contenu */}
        <div className="flex flex-1">
          {/* Sidebar */}
          <Sidebar />

          {/* Main content area */}
          <div className="flex-1 flex flex-col">
            {/* Page content */}
            <div className="flex-1 overflow-auto">
              <div className="space-y-6 caret-transparent p-6">
                <div className="flex justify-between items-center">
                  <h1 className="text-3xl font-bold">Factures</h1>
                </div>

                <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0 sm:space-x-4 mb-6 ">
                  <div className="relative w-full sm:w-96">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Rechercher des factures..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="pl-9 w-full rounded-full bg-gray-50 focus-visible:ring-purple-500 focus-visible:ring-offset-0"
                      spellCheck={false}
                    />
                    <div className="absolute right-6 top-1/3 h-4 w-4 -translate-y-1/2 text-muted-foreground">
                      {factures.isFetching && !factures.isLoading && (
                        <LoadingDots />
                      )}
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Sheet>
                      <SheetTrigger asChild>
                        <Button
                          variant="outline"
                          className="border-purple-500 bg-purple-100 text-purple-700 hover:bg-purple-200 hover:text-purple-900 rounded-full"
                        >
                          <Filter className="mr-2 h-4 w-4" />
                          Filtres
                        </Button>
                      </SheetTrigger>
                      <SheetContent className="border-l-purple-200 bg-white">
                        <SheetHeader>
                          <SheetTitle className="text-black">
                            Filtres
                          </SheetTitle>
                          <SheetDescription className="text-gray-600">
                            Ajustez les filtres pour affiner votre recherche de
                            factures.
                          </SheetDescription>
                        </SheetHeader>
                        <div className="grid gap-4 py-4">
                          <div className="grid grid-cols-4 items-center gap-4 my-2">
                            <Label
                              htmlFor="statut"
                              className="col-span-1 text-left text-black"
                            >
                              Date :
                            </Label>
                            <div className="col-span-3">
                              <CustomDateRangePicker
                                startDate={startDate}
                                setStartDate={setStartDate}
                                endDate={endDate}
                                setEndDate={setEndDate}
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4 my-2">
                            <Label
                              htmlFor="montant"
                              className="text-right text-black"
                            >
                              Montant
                            </Label>
                            <div className="col-span-3">
                              <PriceRangeSlider
                                min={0}
                                max={maxMontant}
                                step={100}
                                value={filters.montant}
                                onValueChange={value =>
                                  setFilters({ ...filters, montant: value })
                                }
                              />
                              <div className="flex justify-between mt-2">
                                <span>{filters.montant[0]} DH</span>
                                <span>{filters.montant[1]} DH</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </SheetContent>
                    </Sheet>
                    <CreateFactureDialog />
                  </div>
                </div>

                <div>
                  <div className="grid gap-3 border mb-3 rounded-lg">
                    {/* the full table  */}
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Numéro</TableHead>
                          <TableHead>Total</TableHead>
                          <TableHead>Client</TableHead>
                          <TableHead>Devis</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {factures?.isLoading ? (
                          [...Array(10)].map((_, index) => (
                            <TableRow
                              className="h-[2rem] MuiTableRow-root"
                              role="checkbox"
                              tabIndex={-1}
                              key={index}
                            >
                              <TableCell className="!py-2" align="left">
                                <Skeleton className="h-4 w-full" />
                              </TableCell>
                              <TableCell className="!py-2" align="left">
                                <Skeleton className="h-4 w-full" />
                              </TableCell>
                              <TableCell className="!py-2" align="left">
                                <Skeleton className="h-4 w-full" />
                              </TableCell>
                              <TableCell className="!py-2" align="left">
                                <Skeleton className="h-4 w-full" />
                              </TableCell>
                              <TableCell className="!py-2" align="left">
                                <Skeleton className="h-4 w-full" />
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
                          factures.data?.map(facture => (
                            <TableRow key={facture.id}>
                              <TableCell className="text-md !py-2">
                                {formatDate(facture.date) ||
                                  formatDate(facture.createdAt)}
                              </TableCell>
                              <TableCell className="text-md !py-2">
                                {facture.numero}
                              </TableCell>
                              <TableCell className="text-md !py-2">
                                {facture.total} MAD
                              </TableCell>
                              <TableCell className="text-md !py-2">
                                {facture.client.nom}
                              </TableCell>
                              <TableCell className="text-md !py-2">
                                {facture.devisNumero}
                              </TableCell>

                              <TableCell className="text-right !py-2">
                                <div className="flex justify-end gap-2">
                                  <CustomTooltip message="imprimer">
                                    <Button
                                      name="delete btn"
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 rounded-full hover:bg-green-100 hover:text-green-600"
                                      onClick={() => {
                                        localStorage.setItem(
                                          "facture",
                                          JSON.stringify(facture)
                                        );
                                        window.open(
                                          `/ventes/factures/imprimer`,
                                          "_blank"
                                        );
                                        setCurrFacture(facture);
                                      }}
                                    >
                                      <Printer className="h-4 w-4" />
                                      <span className="sr-only">Imprimer</span>
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
                                      <span className="sr-only">Supprimer</span>
                                    </Button>
                                  </CustomTooltip>
                                  <CustomTooltip message="Modifier">
                                    <Button
                                      name="update btn"
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 rounded-full hover:bg-purple-100 hover:text-purple-600"
                                      onClick={() => {
                                        setIsUpdateDialogOpen(true);
                                        setCurrFacture(facture);
                                      }}
                                    >
                                      <Pen className="h-4 w-4" />
                                      <span className="sr-only">Modifier</span>
                                    </Button>
                                  </CustomTooltip>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={6} align="center">
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
                                <p>Aucune facture trouvé</p>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                  {factures.data?.length > 0 ? (
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
            </div>
          </div>
        </div>
      </div>
      <DeleteConfirmationDialog
        recordName={currFacture?.numero}
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onConfirm={() => {
          deleteFacture.mutate();
          setIsDialogOpen(false);
        }}
        itemType="factures"
      ></DeleteConfirmationDialog>
      <UpdateFactureDialog
        facture={currFacture}
        isOpen={isUpdateDialogOpen}
        onClose={() => setIsUpdateDialogOpen(false)}
      />
    </>
  );
}
