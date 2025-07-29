"use client";
import * as React from "react";
import { useState, useEffect } from "react";
import toast, { Toaster } from "react-hot-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import CustomPagination from "@/components/customUi/customPagination";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, Filter, Search, ChevronRight, Printer } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { DeleteConfirmationDialog } from "@/components/delete-confirmation-dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import CustomTooltip from "@/components/customUi/customTooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import TransactionDialog from "@/components/new-transaction";
import { LoadingDots } from "@/components/loading-dots";
import ComboBoxFournisseur from "@/components/comboBox-fournisseurs";

function formatDate(dateString: string) {
  return dateString?.split("T")[0].split("-").reverse().join("-");
}
type Transaction = {
  id: string;
  createdAt: string;
  type: string;
  montant: number;
  compte: string;
  reference: string;
  lable: string;
  description: string;
  methodePaiement: string;
  date: string;
  cheque: {
    numero: string;
    dateReglement : string,
  };
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
  createdAt: string; // ou Date, selon ce que tu utilises dans ton code
  updatedAt: string; // ou Date
};

type Compte = {
  compte: string;
};
export default function Banques() {
  const [searchQuery, setSearchQuery] = useState("");
  const [transaction, setTransaction] = useState<Transaction | undefined>();
  const [deleteDialog, setDeleteDialog] = useState<boolean>(false);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>();
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [selectedFournisseur, setSelectedFournisseur] =
    useState<Fournisseur | null>();

  const [filters, setFilters] = useState({
    compte: "all",
    type: "all",
    methodePaiement: "all",
  });
  const queryClient = useQueryClient();

  // Debounce input (waits 500ms after the last keystroke)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery);
      setPage(1);
    }, 500); // Adjust delay as needed

    return () => {
      clearTimeout(handler);
    };
  }, [searchQuery]);

  const transactions = useQuery({
    queryKey: [
      "transactions",
      debouncedQuery,
      page,
      filters.type,
      filters.methodePaiement,
      filters.compte,
      startDate,
      endDate,
      selectedFournisseur,
    ],
    queryFn: async () => {
      const response = await axios.get("/api/tresorie", {
        params: {
          page,
          query: debouncedQuery,
          type: filters.type,
          compte: filters.compte,
          from: startDate,
          to: endDate,
          fournisseurId: selectedFournisseur?.id,
          methodePaiement: filters.methodePaiement,
        },
      });
      console.log("transactions:  ", response.data.transactions);
      setTotalPages(response.data.totalPages);
      return response.data.transactions;
    },
    keepPreviousData: true, // Keeps old data visible while fetching new page
  });

  const deleteTrans = useMutation({
    mutationFn: async () => {
      const loadingToast = toast.loading("Suppression...");
      try {
        await axios.delete("/api/tresorie", {
          params: {
            id: transaction?.id,
          },
        });
        toast(<span>Transaction supprimé avec succée!</span>, {
          icon: "🗑️",
        });
      } catch (error) {
        toast.error("Échec de la suppression");
        throw error;
      } finally {
        toast.dismiss(loadingToast);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["factures"] });
      queryClient.invalidateQueries({ queryKey: ["depensesVariantes"] });
      queryClient.invalidateQueries({ queryKey: ["commandes"] });
    },
  });

  const comptes = useQuery({
    queryKey: ["comptes"],
    queryFn: async () => {
      const response = await axios.get("/api/comptesBancaires");
      const comptes = response.data.comptes;
      console.log("comptes : ", comptes);
      return comptes;
    },
  });

  const handleTypeLableColor = (t: String) => {
    if (t === "recette") {
      return {
        lable: "Recette",
        color: "bg-green-100 text-green-600 font-medium",
      };
    } else if (t === "depense") {
      return { lable: "Dépense", color: "bg-red-100 text-red-600 font-medium" };
    } else if (t === "vider") {
      return {
        lable: "Vider la caisse",
        color: "bg-blue-100 text-blue-600 font-medium",
      };
    } else {
      return {
        lable: "inconue",
        color: "bg-gray-100 text-gray-600 font-medium",
      };
    }
  };
 const handleChequeClick = (transaction: Transaction) => {
  if (transaction.methodePaiement === "cheque") {
    let beneficiaire ="Inconnu"
if (transaction.description.includes("bénéficiaire")){
 beneficiaire = transaction.description
      ?.replace(/bénéficiaire\s*:/i, "") // plus flexible
      .trim() 
} else if (transaction.description.includes("DEV")) {
  beneficiaire = "ste.OUDAOUDOX " 
}

   ;

    const numeroCheque = transaction.cheque?.numero || "Inconnu";
 const montant = transaction.montant || "Inconnu";
 const dateRegelemen = transaction.cheque.dateReglement || "Inconnu";
  const compte = transaction.compte || "Inconnu";

    toast(
      (t) => (
        <div className="flex flex-col gap-4 justify-start items-center ">
          <div className="flex flex-col  text-sm w-full">
            <span>
              Bénéficiaire: <b>{beneficiaire}</b>
            </span>
            <span>
              Montant: <b>{montant}</b>
            </span>
              <span>
              Date de réglement: <b>{formatDate(dateRegelemen)}</b>
            </span>
              <span>
              Compte: <b>{compte}</b>
            </span>
            <span>
              Numéro de chèque: <b>{numeroCheque}</b>
            </span>
          </div>

          <button
            onClick={() => toast.dismiss(t.id)}
            className="ml-auto text-white bg-purple-500 px-3 py-1 rounded hover:bg-purple-600 text-sm"
          >
            Fermer
          </button>
        </div>
      ),
      {
        style: {
          padding: "12px",
          backgroundColor: "#f9f9f9",
        },
        duration: 50000,
      }
    );
  }
};

  return (
    <>
      <Toaster position="top-center" />
      <div className="space-y-6 mb-[5rem]">
        <div className="flex justify-between items-center ">
          <h1 className="text-3xl font-bold">Transactions</h1>
        </div>
        <div className="flex justify-between space-x-2">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Recherche..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-full rounded-full bg-gray-50 focus-visible:ring-purple-500 focus-visible:ring-offset-0"
            />
            <div className="absolute right-6 top-1/3 h-4 w-4 -translate-y-1/2 text-muted-foreground">
              {transactions.isFetching && !transactions.isLoading && (
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
                  <SheetTitle className="text-black">Filtres</SheetTitle>
                  <SheetDescription className="text-gray-600">
                    Ajustez les filtres pour affiner votre recherche de
                    transactions.
                  </SheetDescription>
                </SheetHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid items-center gap-3 my-2">
                    <Label htmlFor="type" className="text-left text-black">
                      Type :
                    </Label>
                    <Select
                      value={filters.type}
                      name="type"
                      onValueChange={(value) =>
                        setFilters({ ...filters, type: value })
                      }
                    >
                      <SelectTrigger className="col-span-3 bg-white focus:ring-purple-500">
                        <SelectValue placeholder="Séléctionner un statut" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous les types</SelectItem>
                        <SelectItem value="recette">
                          <div className="flex items-center gap-2">
                            <span
                              className={`h-2 w-2 shadow-md rounded-full bg-green-500`}
                            />
                            Recette
                          </div>
                        </SelectItem>
                        <SelectItem value="depense">
                          <div className="flex items-center gap-2">
                            <span
                              className={`h-2 w-2 rounded-full bg-red-500`}
                            />
                            Dépense
                          </div>
                        </SelectItem>
                        <SelectItem value="vider">
                          <div className="flex items-center gap-2">
                            <span
                              className={`h-2 w-2 rounded-full bg-blue-500`}
                            />
                            Vider la caisse
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid items-center gap-3 my-2">
                    <Label htmlFor="type" className="text-left text-black">
                      Méthode de paiement :
                    </Label>
                    <Select
                      value={filters.methodePaiement}
                      name="methodePaiement"
                      onValueChange={(value) =>
                        setFilters({ ...filters, methodePaiement: value })
                      }
                    >
                      <SelectTrigger className="col-span-3 bg-white focus:ring-purple-500">
                        <SelectValue placeholder="Séléctionner un statut" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous</SelectItem>
                        <SelectItem value="espece">Éspece</SelectItem>
                        <SelectItem value="cheque">Chèque</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid items-center gap-3 my-2">
                    <Label htmlFor="compte" className="text-left text-black">
                      Compte :
                    </Label>
                    <Select
                      value={filters.compte}
                      name="compte"
                      onValueChange={(value) =>
                        setFilters({ ...filters, compte: value })
                      }
                    >
                      <SelectTrigger className="col-span-3 bg-white focus:ring-purple-500">
                        <SelectValue placeholder="Séléctionner un statut" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous les comptes</SelectItem>
                        {comptes.data?.map((element: Compte, index: number) => (
                          <SelectItem key={index} value={element.compte}>
                            {element.compte}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="date" className="text-left text-black">
                      Date :
                    </Label>
                    <div className="flex gap-2 justify-center items-center">
                      {/* date début */}
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "col-span-3 w-full justify-start text-left font-normal hover:text-purple-600 hover:bg-white hover:border-2 hover:border-purple-500",
                              !startDate && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon />
                            {startDate ? (
                              format(startDate, "dd-MM-yyyy")
                            ) : (
                              <span>début</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={startDate}
                            onSelect={setStartDate}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <ChevronRight className="h-10 w-10" />
                      {/* date fin */}
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "col-span-3 w-full justify-start text-left font-normal hover:text-purple-600 hover:bg-white hover:border-2 hover:border-purple-500",
                              !endDate && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon />
                            {endDate ? (
                              format(endDate, "dd-MM-yyyy")
                            ) : (
                              <span>fin</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={endDate}
                            onSelect={setEndDate}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
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
                  type: filters.type,
                  compte: filters.compte,
                  methodePaiement: filters.methodePaiement,
                  from: startDate,
                  to: endDate,
                  fournisseurId: selectedFournisseur?.id,
                };
                localStorage.setItem("params", JSON.stringify(params));
                window.open("/transactions/impression", "_blank");
              }}
              className="border-purple-500 bg-purple-100 text-purple-700 hover:bg-purple-200 hover:text-purple-900 rounded-full"
            >
              <Printer className="h-4 w-4" />
              Imprimer
            </Button>
            <TransactionDialog />
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
                    <TableHead>Label</TableHead>
                    <TableHead>Montant</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Méthode</TableHead>
                    <TableHead>Compte</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.isLoading ? (
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
                          <Skeleton className="h-4 w-[100px]" />
                        </TableCell>
                        <TableCell className="!py-2" align="left">
                          <Skeleton className="h-4 w-[100px]" />
                        </TableCell>
                        <TableCell className="!py-2" align="left">
                          <Skeleton className="h-4 w-[100px]" />
                        </TableCell>
                        <TableCell className="!py-2" align="left">
                          <Skeleton className="h-4 w-[100px]" />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : transactions.data?.length > 0 ? (
                    transactions.data?.map((transaction: Transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell className="font-medium py-1">
                          {formatDate(transaction.date) ||
                            formatDate(transaction.createdAt)}
                        </TableCell>
                        <TableCell className="font-medium py-0">
                          {transaction.lable}
                        </TableCell>
                        <TableCell className="font-medium py-0">
                          {transaction.montant} DH
                        </TableCell>
                        <TableCell className="font-medium py-0">
                          <span
                            className={`text-sm p-[1px] px-3 rounded-full  ${
                              handleTypeLableColor(transaction.type).color
                            }`}
                          >
                            {handleTypeLableColor(transaction.type).lable}
                          </span>
                        </TableCell>

                        <TableCell
                          onClick={() => handleChequeClick(transaction)}
                          className={`font-medium py-0 ${
                            transaction.methodePaiement === "cheque" &&
                            "cursor-pointer"
                          }`}
                        >
                          {transaction.methodePaiement === "espece"
                            ? "Espèce"
                            : transaction.methodePaiement === "cheque" &&
                              "Chèque"}
                        </TableCell>

                        <TableCell className="font-medium py-0">
                          {transaction.compte}
                        </TableCell>
                        <TableCell className="font-medium py-0">
                          {transaction.description}
                        </TableCell>

                        <TableCell className="text-right py-2">
                          <div className="flex justify-end gap-2">
                            <Button
                              onClick={() => {
                                setDeleteDialog(true);
                                setTransaction(transaction);
                              }}
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-full hover:bg-red-100 hover:text-red-600"
                            >
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">Supprimer</span>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center">
                        Aucune transaction trouvée
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            {totalPages && totalPages > 1 ? (
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
      <DeleteConfirmationDialog
        recordName={"la transaction"}
        isOpen={deleteDialog}
        onClose={() => {
          setDeleteDialog(false);
        }}
        onConfirm={() => {
          deleteTrans.mutate();
          setDeleteDialog(false);
        }}
      />
    </>
  );
}
