"use client";

import AddBonLivraison from "@/components/add-bonLivraison";
import BonLivraisonRapportDialog from "@/components/bonLivraison-rapport-dialog";
import CustomDateRangePicker from "@/components/customUi/customDateRangePicker";
import CustomPagination from "@/components/customUi/customPagination";
import { PriceRangeSlider } from "@/components/customUi/customSlider";
import { DeleteConfirmationDialog } from "@/components/delete-confirmation-dialog";
import { LoadingDots } from "@/components/loading-dots";
import { Navbar } from "@/components/navbar";
import PaiementBLDialog from "@/components/paiement-BL";
import PreviewBonLivraisonDialog from "@/components/preview-bonLivraison";
import { Sidebar } from "@/components/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import UpdateBonLivraison from "@/components/update-bonLivraison";
import { useDeleteBonLivraison } from "@/hooks/useDeleteBonLivraison";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { Filter, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { Toaster } from "react-hot-toast";
import { BonLivraisonT, useBonLivraisonColumns } from "./columns";
import { DataTable } from "./data-table";

function formatDate(dateString: String) {
  return dateString?.split("T")[0].split("-").reverse().join("-");
}

export default function BonLivraison() {
  const [searchQuery, setSearchQuery] = useState("");
  const [maxMontant, setMaxMontant] = useState<number | undefined>(undefined);
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState<number | null>(null);
  const [lastBonLivraison, setLastBonLivraison] = useState();
  const [currentBL, setCurrentBL] = useState<BonLivraisonT | null>(null);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
  const [paiementDialogOpen, setPaiementDialogOpen] = useState(false);
  const [transactions, setTransactions] = useState([]);
  type Transaction = {
    id: string;
    type: string;
    montant: number;
    compte: string;
    lable: string;
    reference: string;
    description: string;
    methodePaiement: string;
    fournisseurId: string | null;
    clientId: string | null;
    date: string;
    chequeId: string | null;
    createdAt: string;
    updatedAt: string;
  };

  type TransactionInfo = {
    date: string;
    montant: number;
    methodePaiement: string;
    compte: string;
  };

  type GroupedTransaction = {
    bl: string;
    transactions: TransactionInfo[];
  };

  function regrouperTransactionsParBL(
    transactionsList: Transaction[]
  ): GroupedTransaction[] {
    const blMap: Record<string, TransactionInfo[]> = {};

    transactionsList.forEach(tx => {
      const match = tx.lable?.match(/BL-\d+/);
      if (!match) return;

      const blNumber = match[0];

      if (!blMap[blNumber]) {
        blMap[blNumber] = [];
      }

      blMap[blNumber].push({
        date: tx.date,
        montant: tx.montant,
        methodePaiement: tx.methodePaiement,
        compte: tx.compte,
      });
    });

    return Object.entries(blMap).map(([bl, transactions]) => ({
      bl,
      transactions,
    }));
  }

  const [filters, setFilters] = useState({
    type: "",
    statutPaiement: "",
    montant: [0, typeof maxMontant === "number" ? maxMontant : 0],
  });
  const deleteBonLivraison = useDeleteBonLivraison();
  useEffect(() => {
    setFilters(prev => ({
      ...prev,
      montant: [0, typeof maxMontant === "number" ? maxMontant : 0],
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

  // Réinitialiser la page à 1 lorsque les filtres changent
  useEffect(() => {
    setPage(1);
  }, [
    filters.type,
    filters.statutPaiement,
    filters.montant,
    startDate,
    endDate,
  ]);

  const {
    data: bonLivraison,
    isLoading,
    isFetching,
  } = useQuery({
    queryKey: [
      "bonLivraison",
      filters.type,
      debouncedQuery,
      page,
      startDate,
      endDate,
      filters.montant,
      filters.statutPaiement,
    ],
    queryFn: async () => {
      const response = await axios.get("/api/bonLivraison", {
        params: {
          query: debouncedQuery,
          page,
          type: filters.type,
          from: startDate,
          to: endDate,
          minTotal: filters.montant[0],
          maxTotal: filters.montant[1],
          statutPaiement: filters.statutPaiement,
        },
      });
      setMaxMontant(response.data.maxMontant);
      setLastBonLivraison(response.data.lastBonLivraison);
      setTotalPages(response.data.totalPages);
      setTransactions(response.data.transactionsList);
      return response.data.bonLivraison;
    },
    keepPreviousData: true,
    refetchOnWindowFocus: false,
  });
  const listBonLivraison =
    bonLivraison?.map((bon: any) => ({
      id: bon.id,
      date: formatDate(bon.date),
      numero: bon.numero,
      type: bon.type,
      totalPaye: bon.totalPaye,
      reference: bon.reference,
      fournisseur: bon.fournisseur.nom,
      fournisseurId: bon.fournisseur.id,
      total: bon.total,
      groups: bon.groups,
      statutPaiement: bon.statutPaiement,
      transactions:
        regrouperTransactionsParBL(transactions).find(
          group => group.bl === bon.numero
        )?.transactions || [],
    })) ?? [];

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
              <div className="container mx-auto space-y-2 mb-[5rem] p-6">
                <div className="flex justify-between items-center mb-2">
                  <h1 className="text-3xl font-bold">Bons de livraisons</h1>
                </div>
                <div className="flex justify-between items-center">
                  <div className="relative w-full sm:w-96">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Rechercher des bon de livraison..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="pl-9 w-full rounded-full bg-gray-50 focus-visible:ring-purple-500 focus-visible:ring-offset-0"
                      spellCheck={false}
                    />
                    <div className="absolute right-6 top-1/3 h-4 w-4 -translate-y-1/2 text-muted-foreground">
                      {isFetching && !isLoading && <LoadingDots />}
                    </div>
                  </div>

                  <div className="flex gap-3">
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
                            bons de livraison.
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
                            <Label className="col-span-1 text-sm font-medium block pt-1">
                              Type :
                            </Label>
                            <div className="col-span-3">
                              <Select
                                value={filters.type}
                                onValueChange={value =>
                                  setFilters({ ...filters, type: value })
                                }
                              >
                                <SelectTrigger className="w-full col-span-3 bg-white focus:ring-purple-500">
                                  <SelectValue placeholder="Séléctionnez ..." />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectGroup>
                                    <SelectItem value="achats">
                                      Achats
                                    </SelectItem>
                                    <SelectItem value="retour">
                                      Retour
                                    </SelectItem>
                                    <SelectItem value="all">Tous</SelectItem>
                                  </SelectGroup>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4 my-2">
                            <Label className="col-span-1 text-sm font-medium block pt-1">
                              Statut :
                            </Label>
                            <div className="col-span-3">
                              <Select
                                value={filters.statutPaiement}
                                onValueChange={value =>
                                  setFilters({
                                    ...filters,
                                    statutPaiement: value,
                                  })
                                }
                              >
                                <SelectTrigger className="w-full col-span-3 bg-white focus:ring-purple-500">
                                  <SelectValue placeholder="Séléctionnez ..." />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectGroup>
                                    <SelectItem value="paye">
                                      <div className="flex items-center gap-2">
                                        <span className="h-2 w-2 rounded-full bg-green-500" />
                                        Payé
                                      </div>
                                    </SelectItem>
                                    <SelectItem value="impaye">
                                      <div className="flex items-center gap-2">
                                        <span className="h-2 w-2 rounded-full bg-red-500" />
                                        Impayé
                                      </div>
                                    </SelectItem>
                                    <SelectItem value="enPartie">
                                      <div className="flex items-center gap-2">
                                        <span className="h-2 w-2 rounded-full bg-amber-500" />
                                        En partie
                                      </div>
                                    </SelectItem>
                                    <SelectItem value="all">
                                      <div className="flex items-center gap-2">
                                        <span className="h-2 w-2 rounded-full bg-slate-500" />
                                        Tout
                                      </div>
                                    </SelectItem>
                                  </SelectGroup>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4 my-2">
                            <Label
                              htmlFor="montant"
                              className="col-span-1 text-left text-black"
                            >
                              Montant :
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
                    <AddBonLivraison lastBonLivraison={lastBonLivraison} />
                    <BonLivraisonRapportDialog />
                  </div>
                </div>
                <DataTable
                  columns={useBonLivraisonColumns({
                    setCurrentBL,
                    setPreviewDialogOpen,
                    setDeleteDialogOpen,
                    setUpdateDialogOpen,
                    setPaiementDialogOpen,
                  })}
                  data={listBonLivraison}
                  isLoading={isLoading}
                />
                {bonLivraison?.length > 0 ? (
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
      <UpdateBonLivraison
        bonLivraison={currentBL}
        isOpen={updateDialogOpen}
        onClose={() => setUpdateDialogOpen(false)}
      />
      <DeleteConfirmationDialog
        recordName={currentBL?.numero}
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={() => {
          setDeleteDialogOpen(false);
          deleteBonLivraison.mutate(currentBL);
        }}
      />
      <PreviewBonLivraisonDialog
        bonLivraison={currentBL}
        isOpen={previewDialogOpen}
        onClose={() => setPreviewDialogOpen(false)}
      />
      <PaiementBLDialog
        bonLivraison={currentBL}
        isOpen={paiementDialogOpen}
        onClose={() => setPaiementDialogOpen(false)}
      />
    </>
  );
}
