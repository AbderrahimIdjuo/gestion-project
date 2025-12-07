"use client";
import ComboBoxFournisseur from "@/components/comboBox-fournisseurs";
import CreatefactureAchatsDialog from "@/components/create-facture-societe-dialog";
import CustomDateRangePicker from "@/components/customUi/customDateRangePicker";
import CustomPagination from "@/components/customUi/customPagination";
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
import ViewReglementDialog from "@/components/view-reglement-dialog";
import { formatCurrency, formatDate } from "@/lib/functions";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { Filter, Info, Plus, Printer, Search, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import toast, { Toaster } from "react-hot-toast";

type factureAchats = {
  id: string;
  numero: string | null;
  date: string | null;
  total: number | null;
  createdAt: string;
  fournisseur: {
    id: string;
    nom: string;
    email?: string | null;
    telephone?: string | null;
    adresse?: string | null;
    ice?: string | null;
  };
  reglements: {
    id: string;
    montant: number;
    dateReglement: string;
    statut: string;
  }[];
};

type Fournisseur = {
  id: string;
  nom: string;
  adresse: string | null;
  email: string | null;
  telephone: string | null;
  telephoneSecondaire: string | null;
  ice: string | null;
  dette: number;
  createdAt: string;
  updatedAt: string;
};

const PAGE_SIZE = 10;

export default function FacturesAchatsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [factureForTable, setFactureForTable] = useState<
    factureAchats | undefined
  >();
  const [deleteDialog, setDeleteDialog] = useState<boolean>(false);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>();
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [selectedFournisseur, setSelectedFournisseur] =
    useState<Fournisseur | null>();
  const [viewDialog, setViewDialog] = useState(false);
  const [selectedFacture, setSelectedFacture] = useState<factureAchats | null>(
    null
  );
  const [factureDialog, setFactureDialog] = useState(false);
  const [selectedReglementId, setSelectedReglementId] = useState<string | null>(
    null
  );
  const [reglementDialogOpen, setReglementDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  // Debounce input (waits 500ms after the last keystroke)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery);
      setPage(1);
    }, 500);

    return () => {
      clearTimeout(handler);
    };
  }, [searchQuery]);

  const factures = useQuery({
    queryKey: [
      "FacturesAchats",
      debouncedQuery,
      page,
      startDate,
      endDate,
      selectedFournisseur,
    ],
    queryFn: async () => {
      const response = await axios.get("/api/facturesAchats", {
        params: {
          page,
          query: debouncedQuery,
          from: startDate,
          to: endDate,
          fournisseurId: selectedFournisseur?.id,
        },
      });
      setTotalPages(response.data.totalPages);
      return response.data;
    },
    keepPreviousData: true,
    refetchOnWindowFocus: false,
  });

  const deleteFacture = useMutation({
    mutationFn: async (id: string) => {
      const loadingToast = toast.loading("Suppression de la facture...");
      try {
        const response = await axios.delete(`/api/facturesAchats/${id}`);
        toast.success("Facture supprimée avec succès");
        return response.data;
      } catch (error) {
        toast.error("Échec de la suppression de la facture");
        throw error;
      } finally {
        toast.dismiss(loadingToast);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["FacturesAchats"] });
    },
  });

  const hasFactures = factures.data?.factures?.length > 0;

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
              <div className="space-y-6 mb-[5rem] p-6">
                <div className="flex justify-between items-center ">
                  <h1 className="text-3xl font-bold">Factures Achats</h1>
                </div>
                <div className="flex justify-between space-x-2">
                  <div className="relative w-full sm:w-96">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Recherche..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="pl-9 w-full rounded-full bg-gray-50 focus-visible:ring-purple-500 focus-visible:ring-offset-0"
                    />
                    <div className="absolute right-6 top-1/3 h-4 w-4 -translate-y-1/2 text-muted-foreground">
                      {factures.isFetching && !factures.isLoading && (
                        <LoadingDots />
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 items-center">
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
                          <div className="grid gap-2">
                            <Label
                              htmlFor="date"
                              className="text-left text-black"
                            >
                              Date :
                            </Label>
                            <CustomDateRangePicker
                              startDate={startDate}
                              setStartDate={setStartDate}
                              endDate={endDate}
                              setEndDate={setEndDate}
                            />
                          </div>
                          <div className="w-full space-y-2">
                            <ComboBoxFournisseur
                              fournisseur={selectedFournisseur}
                              setFournisseur={setSelectedFournisseur}
                            />
                          </div>
                        </div>
                      </SheetContent>
                    </Sheet>
                    <Button
                      variant="outline"
                      onClick={() => {
                        const params = {
                          from: startDate,
                          to: endDate,
                          fournisseurId: selectedFournisseur?.id,
                        };
                        localStorage.setItem("params", JSON.stringify(params));
                        // window.open("/FacturesAchats/impression", "_blank");
                        toast("Fonctionnalité d'impression à venir");
                      }}
                      className="border-purple-500 bg-purple-100 text-purple-700 hover:bg-purple-200 hover:text-purple-900 rounded-full"
                    >
                      <Printer className="h-4 w-4" />
                      Imprimer
                    </Button>
                    <Button
                      className="bg-gradient-to-r from-fuchsia-500 via-purple-500 to-violet-500 hover:bg-purple-600 text-white font-semibold transition-all duration-300 transform hover:scale-105 rounded-full"
                      onClick={() => setFactureDialog(true)}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Ajouter une facture
                    </Button>
                    <CreatefactureAchatsDialog
                      reglement={null}
                      open={factureDialog}
                      onOpenChange={setFactureDialog}
                    />
                  </div>
                </div>
                <div className="flex justify between gap-6 items-start">
                  <div className="w-full col-span-1 sm:col-span-2 md:col-span-3">
                    {/* Table */}
                    <div className="rounded-lg border overflow-x-auto mb-3">
                      <Table className="w-full">
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[150px]">Date</TableHead>
                            <TableHead>Numéro</TableHead>
                            <TableHead>Fournisseur</TableHead>
                            <TableHead>ICE</TableHead>
                            <TableHead>Total</TableHead>
                            <TableHead className="text-center">
                              Actions
                            </TableHead>
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
                                  <Skeleton className="h-4 w-[150px]" />
                                </TableCell>
                                <TableCell className="!py-2" align="left">
                                  <Skeleton className="h-4 w-[150px]" />
                                </TableCell>
                                <TableCell className="!py-2" align="left">
                                  <Skeleton className="h-4 w-[150px]" />
                                </TableCell>
                                <TableCell className="!py-2" align="left">
                                  <Skeleton className="h-4 w-[120px]" />
                                </TableCell>
                                <TableCell className="!py-2" align="left">
                                  <Skeleton className="h-4 w-[100px]" />
                                </TableCell>
                                <TableCell className="!py-2">
                                  <div className="flex gap-2 justify-end">
                                    <Skeleton className="h-7 w-7 rounded-full" />
                                    <Skeleton className="h-7 w-7 rounded-full" />
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))
                          ) : hasFactures ? (
                            factures.data?.factures?.map(
                              (facture: factureAchats) => {
                                return (
                                  <TableRow key={facture.id}>
                                    <TableCell className="font-medium py-1">
                                      {formatDate(facture.date) ||
                                        formatDate(facture.createdAt) ||
                                        "—"}
                                    </TableCell>
                                    <TableCell className="font-medium py-0">
                                      {facture.numero || "—"}
                                    </TableCell>
                                    <TableCell className="font-medium py-0">
                                      {facture.fournisseur.nom || "—"}
                                    </TableCell>
                                    <TableCell className="font-medium py-0">
                                      {facture.fournisseur.ice || "—"}
                                    </TableCell>
                                    <TableCell className="font-medium py-0">
                                      {formatCurrency(facture.total || 0)}
                                    </TableCell>
                                    <TableCell className="text-right py-2">
                                      <div className="flex justify-end gap-2">
                                        <Button
                                          onClick={e => {
                                            e.stopPropagation();
                                            if (
                                              facture.reglements &&
                                              facture.reglements.length > 0
                                            ) {
                                              setSelectedReglementId(
                                                facture.reglements[0].id
                                              );
                                              setReglementDialogOpen(true);
                                            } else {
                                              toast(
                                                "Cette facture n'a pas de règlements"
                                              );
                                            }
                                          }}
                                          variant="ghost"
                                          size="icon"
                                          className="h-8 w-8 rounded-full hover:bg-blue-100 hover:text-blue-600"
                                          title="Voir les détails du règlement"
                                        >
                                          <Info className="h-4 w-4" />
                                          <span className="sr-only">
                                            Voir les détails
                                          </span>
                                        </Button>
                                        <Button
                                          onClick={() => {
                                            setDeleteDialog(true);
                                            setFactureForTable(facture);
                                          }}
                                          variant="ghost"
                                          size="icon"
                                          className="h-8 w-8 rounded-full hover:bg-red-100 hover:text-red-600"
                                        >
                                          <Trash2 className="h-4 w-4" />
                                          <span className="sr-only">
                                            Supprimer
                                          </span>
                                        </Button>
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                );
                              }
                            )
                          ) : (
                            <TableRow>
                              <TableCell colSpan={6} className="text-center">
                                Aucune facture trouvée
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                    {hasFactures && (
                      <CustomPagination
                        currentPage={page}
                        setCurrentPage={setPage}
                        totalPages={totalPages || 1}
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <DeleteConfirmationDialog
        recordName={factureForTable?.numero || "cette facture"}
        isOpen={deleteDialog}
        onClose={() => setDeleteDialog(false)}
        onConfirm={() => {
          if (factureForTable) {
            deleteFacture.mutate(factureForTable.id);
            setDeleteDialog(false);
          }
        }}
      />
      <ViewReglementDialog
        reglementId={selectedReglementId}
        open={reglementDialogOpen}
        onOpenChange={setReglementDialogOpen}
      />
    </>
  );
}
