"use client";
import ComboBoxFournisseur from "@/components/comboBox-fournisseurs";
import ComptesRapportDialog from "@/components/comptes-rapport-dialog";
import CustomDateRangePicker from "@/components/customUi/customDateRangePicker";
import CustomPagination from "@/components/customUi/customPagination";
import { DeleteConfirmationDialog } from "@/components/delete-confirmation-dialog";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { LoadingDots } from "@/components/loading-dots";
import { Navbar } from "@/components/navbar";
import TransactionDialog from "@/components/new-transaction";
import { Sidebar } from "@/components/sidebar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
import UpdateTransactionDialog from "@/components/update-transaction";
import {
  formatCurrency,
  formatDate,
  methodePaiementLabel,
} from "@/lib/functions";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import {
  ChevronDown,
  Filter,
  Landmark,
  Pen,
  Printer,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import { useUser } from "@clerk/nextjs";

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
    dateReglement: string;
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

// Montant en lettres pour l'affichage chèque/traite
function nombreEnLettres(n: number): string {
  const unites = ["", "un", "deux", "trois", "quatre", "cinq", "six", "sept", "huit", "neuf"];
  const dizaines = ["", "dix", "vingt", "trente", "quarante", "cinquante", "soixante"];
  const dizainesSpeciales = ["dix", "onze", "douze", "treize", "quatorze", "quinze", "seize"];
  function convertMoinsDeCent(n: number): string {
    if (n < 10) return unites[n];
    if (n < 17) return dizainesSpeciales[n - 10];
    if (n < 20) return "dix-" + unites[n - 10];
    if (n < 70) {
      const d = Math.floor(n / 10);
      const u = n % 10;
      return dizaines[d] + (u === 1 ? "-et-un" : u > 0 ? "-" + unites[u] : "");
    }
    if (n < 80) return "soixante-" + convertMoinsDeCent(n - 60);
    if (n < 100) return "quatre-vingt" + (n === 80 ? "s" : "-" + convertMoinsDeCent(n - 80));
    return "";
  }
  function convertMoinsDeMille(n: number): string {
    if (n < 100) return convertMoinsDeCent(n);
    const c = Math.floor(n / 100);
    const r = n % 100;
    return (c === 1 ? "cent" : unites[c] + " cent" + (r === 0 ? "s" : "")) + (r > 0 ? " " + convertMoinsDeCent(r) : "");
  }
  function convertir(n: number): string {
    if (n === 0) return "zéro";
    if (n < 1000) return convertMoinsDeMille(n);
    const m = Math.floor(n / 1000);
    const r = n % 1000;
    return (m === 1 ? "mille" : convertMoinsDeMille(m) + " mille") + (r > 0 ? " " + convertMoinsDeMille(r) : "");
  }
  return convertir(Math.floor(n)).trim();
}

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
  const [updateDialog, setUpdateDialog] = useState(false);
  const [chequeTraiteDialogOpen, setChequeTraiteDialogOpen] = useState(false);
  const [selectedTransactionForCheque, setSelectedTransactionForCheque] =
    useState<Transaction | null>(null);
  const [filters, setFilters] = useState({
    compte: [] as string[],
    type: [] as string[],
    methodePaiement: [] as string[],
    typeDepense: "all",
  });
  const queryClient = useQueryClient();
  const { user } = useUser();
  const isAdmin = user?.publicMetadata?.role === "admin";

  // Fonctions pour gérer les filtres multiples
  const handleTypeChange = (type: string, checked: boolean) => {
    setFilters(prev => ({
      ...prev,
      type: checked ? [...prev.type, type] : prev.type.filter(t => t !== type),
    }));
  };

  const removeType = (type: string) => {
    setFilters(prev => ({
      ...prev,
      type: prev.type.filter(t => t !== type),
    }));
  };

  const handleMethodePaiementChange = (methode: string, checked: boolean) => {
    setFilters(prev => ({
      ...prev,
      methodePaiement: checked
        ? [...prev.methodePaiement, methode]
        : prev.methodePaiement.filter(m => m !== methode),
    }));
  };

  const removeMethodePaiement = (methode: string) => {
    setFilters(prev => ({
      ...prev,
      methodePaiement: prev.methodePaiement.filter(m => m !== methode),
    }));
  };

  const handleCompteChange = (compte: string, checked: boolean) => {
    setFilters(prev => ({
      ...prev,
      compte: checked
        ? [...prev.compte, compte]
        : prev.compte.filter(c => c !== compte),
    }));
  };

  const removeCompte = (compte: string) => {
    setFilters(prev => ({
      ...prev,
      compte: prev.compte.filter(c => c !== compte),
    }));
  };

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

  // Réinitialiser la page à 1 lorsque les filtres changent
  useEffect(() => {
    setPage(1);
  }, [
    filters.type,
    filters.typeDepense,
    filters.methodePaiement,
    filters.compte,
    startDate,
    endDate,
    selectedFournisseur,
  ]);

  const transactions = useQuery({
    queryKey: [
      "transactions",
      debouncedQuery,
      page,
      filters.type,
      filters.typeDepense,
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
          type: filters.type.length > 0 ? filters.type.join("-") : "all",
          compte: filters.compte.length > 0 ? filters.compte.join("-") : "all",
          typeDepense: filters.typeDepense,
          from: startDate,
          to: endDate,
          fournisseurId: selectedFournisseur?.id,
          methodePaiement:
            filters.methodePaiement.length > 0
              ? filters.methodePaiement.join("-")
              : "all",
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
      if (!isAdmin) {
        toast.error("Accès refusé: seul l'admin peut supprimer une transaction.");
        return;
      }
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
      queryClient.invalidateQueries({ queryKey: ["bonLivraison"] });
      queryClient.invalidateQueries({ queryKey: ["devis"] });
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
    } else if (t === "transfert") {
      return {
        lable: "Transfert",
        color: "bg-fuchsia-100 text-fuchsia-600 font-medium",
      };
    }else {
      return {
        lable: "inconue",
        color: "bg-gray-100 text-gray-600 font-medium",
      };
    }
  };

  const handleChequeClick = (transaction: Transaction) => {
    if (
      transaction.methodePaiement === "cheque" ||
      transaction.methodePaiement === "traite"
    ) {
      setSelectedTransactionForCheque(transaction);
      setChequeTraiteDialogOpen(true);
    }
  };

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
                  <h1 className="text-3xl font-bold">Transactions</h1>
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
                          <SheetTitle className="text-black">
                            Filtres
                          </SheetTitle>
                          <SheetDescription className="text-gray-600">
                            Ajustez les filtres pour affiner votre recherche de
                            transactions.
                          </SheetDescription>
                        </SheetHeader>
                        <div className="grid gap-4 py-4">
                          <div className="grid items-center gap-3 my-2">
                            <Label
                              htmlFor="type"
                              className="text-left text-black"
                            >
                              Type :
                            </Label>
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  className="w-full justify-between text-left font-normal focus:ring-2 focus:ring-purple-500 bg-white"
                                >
                                  <div className="flex flex-wrap gap-1">
                                    {filters.type.length === 0 ? (
                                      <span className="text-muted-foreground">
                                        Sélectionner les types
                                      </span>
                                    ) : (
                                      filters.type.map(type => (
                                        <Badge
                                          key={type}
                                          variant="secondary"
                                          className={`text-xs ${
                                            type === "recette"
                                              ? "bg-green-100 text-green-800 hover:bg-green-200"
                                              : type === "depense"
                                              ? "bg-red-100 text-red-800 hover:bg-red-200"
                                              : type === "vider"
                                              ? "bg-blue-100 text-blue-800 hover:bg-blue-200"
                                              : "bg-fuchsia-100 text-fuchsia-800 hover:bg-fuchsia-200"
                                          }`}
                                        >
                                          {type === "recette"
                                            ? "Recette"
                                            : type === "depense"
                                            ? "Dépense"
                                            : type === "vider"
                                            ? "Vider la caisse"
                                            : "Transfert"}
                                          <X
                                            className="ml-1 h-3 w-3 cursor-pointer hover:text-purple-600"
                                            onClick={e => {
                                              e.stopPropagation();
                                              removeType(type);
                                            }}
                                          />
                                        </Badge>
                                      ))
                                    )}
                                  </div>
                                  <ChevronDown className="h-4 w-4 opacity-50" />
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent
                                className="w-full p-3"
                                align="start"
                              >
                                <div className="space-y-3">
                                  <div className="flex items-center space-x-2">
                                    <Checkbox
                                      id="recette"
                                      checked={filters.type.includes("recette")}
                                      onCheckedChange={checked =>
                                        handleTypeChange(
                                          "recette",
                                          checked as boolean
                                        )
                                      }
                                    />
                                    <Label
                                      htmlFor="recette"
                                      className="text-sm font-medium cursor-pointer flex items-center gap-2"
                                    >
                                      <span className="h-2 w-2 shadow-md rounded-full bg-green-500" />
                                      Recette
                                    </Label>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <Checkbox
                                      id="depense"
                                      checked={filters.type.includes("depense")}
                                      onCheckedChange={checked =>
                                        handleTypeChange(
                                          "depense",
                                          checked as boolean
                                        )
                                      }
                                    />
                                    <Label
                                      htmlFor="depense"
                                      className="text-sm font-medium cursor-pointer flex items-center gap-2"
                                    >
                                      <span className="h-2 w-2 rounded-full bg-red-500" />
                                      Dépense
                                    </Label>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <Checkbox
                                      id="vider"
                                      checked={filters.type.includes("vider")}
                                      onCheckedChange={checked =>
                                        handleTypeChange(
                                          "vider",
                                          checked as boolean
                                        )
                                      }
                                    />
                                    <Label
                                      htmlFor="vider"
                                      className="text-sm font-medium cursor-pointer flex items-center gap-2"
                                    >
                                      <span className="h-2 w-2 rounded-full bg-blue-500" />
                                      Vider la caisse
                                    </Label>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <Checkbox
                                      id="transfert"
                                      checked={filters.type.includes("transfert")}
                                      onCheckedChange={checked =>
                                        handleTypeChange(
                                          "transfert",
                                          checked as boolean
                                        )
                                      }
                                    />
                                    <Label
                                      htmlFor="transfert"
                                      className="text-sm font-medium cursor-pointer flex items-center gap-2"
                                    >
                                      <span className="h-2 w-2 rounded-full bg-fuchsia-500" />
                                      Transfert
                                    </Label>
                                  </div>
                                </div>
                              </PopoverContent>
                            </Popover>
                          </div>
                          <div className="grid items-center gap-3 my-2">
                            <Label
                              htmlFor="methodePaiement"
                              className="text-left text-black"
                            >
                              Méthode de paiement :
                            </Label>
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  className="w-full justify-between text-left font-normal focus:ring-2 focus:ring-purple-500 bg-white"
                                >
                                  <div className="flex flex-wrap gap-1">
                                    {filters.methodePaiement.length === 0 ? (
                                      <span className="text-muted-foreground">
                                        Sélectionner les méthodes
                                      </span>
                                    ) : (
                                      filters.methodePaiement.map(methode => (
                                        <Badge
                                          key={methode}
                                          variant="secondary"
                                          className="text-xs bg-purple-100 text-purple-800 hover:bg-purple-200"
                                        >
                                          {methode === "espece"
                                            ? "Espèce"
                                            : methode === "cheque"
                                            ? "Chèque"
                                            : methode === "versement"
                                            ? "Versement"
                                            : methode === "traite"
                                            ? "Traite"
                                            : methode}
                                          <X
                                            className="ml-1 h-3 w-3 cursor-pointer hover:text-purple-600"
                                            onClick={e => {
                                              e.stopPropagation();
                                              removeMethodePaiement(methode);
                                            }}
                                          />
                                        </Badge>
                                      ))
                                    )}
                                  </div>
                                  <ChevronDown className="h-4 w-4 opacity-50" />
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent
                                className="w-full p-3"
                                align="start"
                              >
                                <div className="space-y-3">
                                  <div className="flex items-center space-x-2">
                                    <Checkbox
                                      id="espece"
                                      checked={filters.methodePaiement.includes(
                                        "espece"
                                      )}
                                      onCheckedChange={checked =>
                                        handleMethodePaiementChange(
                                          "espece",
                                          checked as boolean
                                        )
                                      }
                                    />
                                    <Label
                                      htmlFor="espece"
                                      className="text-sm font-medium cursor-pointer"
                                    >
                                      Espèce
                                    </Label>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <Checkbox
                                      id="cheque"
                                      checked={filters.methodePaiement.includes(
                                        "cheque"
                                      )}
                                      onCheckedChange={checked =>
                                        handleMethodePaiementChange(
                                          "cheque",
                                          checked as boolean
                                        )
                                      }
                                    />
                                    <Label
                                      htmlFor="cheque"
                                      className="text-sm font-medium cursor-pointer"
                                    >
                                      Chèque
                                    </Label>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <Checkbox
                                      id="versement"
                                      checked={filters.methodePaiement.includes(
                                        "versement"
                                      )}
                                      onCheckedChange={checked =>
                                        handleMethodePaiementChange(
                                          "versement",
                                          checked as boolean
                                        )
                                      }
                                    />
                                    <Label
                                      htmlFor="versement"
                                      className="text-sm font-medium cursor-pointer"
                                    >
                                      Versement
                                    </Label>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <Checkbox
                                      id="traite"
                                      checked={filters.methodePaiement.includes(
                                        "traite"
                                      )}
                                      onCheckedChange={checked =>
                                        handleMethodePaiementChange(
                                          "traite",
                                          checked as boolean
                                        )
                                      }
                                    />
                                    <Label
                                      htmlFor="traite"
                                      className="text-sm font-medium cursor-pointer"
                                    >
                                      Traite
                                    </Label>
                                  </div>
                                </div>
                              </PopoverContent>
                            </Popover>
                          </div>
                          <div className="grid items-center gap-3 my-2">
                            <Label
                              htmlFor="compte"
                              className="text-left text-black"
                            >
                              Compte :
                            </Label>
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  className="w-full justify-between text-left font-normal focus:ring-2 focus:ring-purple-500 bg-white"
                                >
                                  <div className="flex flex-wrap gap-1">
                                    {filters.compte.length === 0 ? (
                                      <span className="text-muted-foreground">
                                        Sélectionner les comptes
                                      </span>
                                    ) : (
                                      filters.compte.map(compte => (
                                        <Badge
                                          key={compte}
                                          variant="secondary"
                                          className="text-xs bg-slate-100 text-slate-800 hover:bg-slate-200"
                                        >
                                          {compte}
                                          <X
                                            className="ml-1 h-3 w-3 cursor-pointer hover:text-purple-600"
                                            onClick={e => {
                                              e.stopPropagation();
                                              removeCompte(compte);
                                            }}
                                          />
                                        </Badge>
                                      ))
                                    )}
                                  </div>
                                  <ChevronDown className="h-4 w-4 opacity-50" />
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent
                                className="w-full p-3 max-h-[300px] overflow-y-auto"
                                align="start"
                              >
                                <div className="space-y-3">
                                  {comptes.data?.map(
                                    (element: Compte, index: number) => (
                                      <div
                                        key={index}
                                        className="flex items-center space-x-2"
                                      >
                                        <Checkbox
                                          id={`compte-${index}`}
                                          checked={filters.compte.includes(
                                            element.compte
                                          )}
                                          onCheckedChange={checked =>
                                            handleCompteChange(
                                              element.compte,
                                              checked as boolean
                                            )
                                          }
                                        />
                                        <Label
                                          htmlFor={`compte-${index}`}
                                          className="text-sm font-medium cursor-pointer"
                                        >
                                          {element.compte}
                                        </Label>
                                      </div>
                                    )
                                  )}
                                </div>
                              </PopoverContent>
                            </Popover>
                          </div>
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
                          type:
                            filters.type.length > 0
                              ? filters.type.join("-")
                              : "all",
                          compte:
                            filters.compte.length > 0
                              ? filters.compte.join("-")
                              : "all",
                          methodePaiement:
                            filters.methodePaiement.length > 0
                              ? filters.methodePaiement.join("-")
                              : "all",
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
                    <ComptesRapportDialog />
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
                            <TableHead className="text-center">
                              Actions
                            </TableHead>
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
                                <TableCell className="!py-2">
                                  <div className="flex gap-2 justify-end">
                                    <Skeleton className="h-7 w-7 rounded-full" />
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))
                          ) : transactions.data?.length > 0 ? (
                            transactions.data?.map(
                              (transaction: Transaction) => (
                                <TableRow key={transaction.id} >
                                  <TableCell className="font-medium py-2">
                                    {formatDate(transaction.date) ||
                                      formatDate(transaction.createdAt)}
                                  </TableCell>
                                  <TableCell className="font-medium py-2">
                                    {transaction.lable}
                                  </TableCell>
                                  <TableCell className="font-medium py-2">
                                    {formatCurrency(transaction.montant)}
                                  </TableCell>
                                  <TableCell className="font-medium py-2">
                                    <span
                                      className={`text-sm p-[1px] px-3 rounded-full  ${
                                        handleTypeLableColor(transaction.type)
                                          .color
                                      }`}
                                    >
                                      {
                                        handleTypeLableColor(transaction.type)
                                          .lable
                                      }
                                    </span>
                                  </TableCell>

                                  <TableCell
                                    onClick={() =>
                                      handleChequeClick(transaction)
                                    }
                                    className={`font-medium py-2 ${
                                      (transaction.methodePaiement ===
                                        "cheque" ||
                                        transaction.methodePaiement ===
                                          "traite") &&
                                      "cursor-pointer"
                                    }`}
                                  >
                                    {methodePaiementLabel(transaction)}
                                  </TableCell>

                                  <TableCell className="font-medium py-2">
                                    {transaction.compte}
                                  </TableCell>
                                  <TableCell className="font-medium py-2">
                                    {transaction.description}
                                  </TableCell>

                                  <TableCell className="text-right py-2">
                                    <div className="flex justify-end gap-2">
                                      {isAdmin && (
                                        <>
                                          <Button
                                            onClick={() => {
                                              setUpdateDialog(true);
                                              setTransaction(transaction);
                                            }}
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 rounded-full hover:bg-purple-100 hover:text-purple-600"
                                          >
                                            <Pen className="h-4 w-4" />
                                            <span className="sr-only">
                                              modifier
                                            </span>
                                          </Button>
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
                                            <span className="sr-only">
                                              Supprimer
                                            </span>
                                          </Button>
                                        </>
                                      )}
                                    </div>
                                  </TableCell>
                                </TableRow>
                              )
                            )
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
            </div>
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

      <Dialog
        open={chequeTraiteDialogOpen}
        onOpenChange={open => {
          setChequeTraiteDialogOpen(open);
          if (!open) setSelectedTransactionForCheque(null);
        }}
      >
        <DialogContent className="sm:max-w-5xl max-h-[95vh] overflow-y-auto p-0">
          {selectedTransactionForCheque && (
            <div className="space-y-4 p-6">
              <DialogHeader className="text-center pb-4">
                <DialogTitle className="text-2xl font-bold">
                  {selectedTransactionForCheque.methodePaiement === "cheque"
                    ? "CHÈQUE BANCAIRE"
                    : "TRAITE"}
                </DialogTitle>
              </DialogHeader>

              <div className="border-2 border-gray-800 bg-white p-8 shadow-2xl relative overflow-hidden min-h-[280px]">
                <div className="absolute top-0 left-0 right-0 h-1 border-b border-dotted border-gray-400" />
                <div className="absolute bottom-0 left-0 right-0 h-1 border-t border-dotted border-gray-400" />
                <div className="absolute left-0 top-0 bottom-0 w-1 border-r border-dotted border-gray-400" />
                <div className="absolute right-0 top-0 bottom-0 w-1 border-l border-dotted border-gray-400" />
                <div
                  className="absolute inset-0 opacity-[0.02] pointer-events-none"
                  style={{
                    backgroundImage:
                      "repeating-linear-gradient(45deg, transparent, transparent 10px, #000 10px, #000 11px)",
                  }}
                />

                <div className="relative z-10 h-full flex flex-col">
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center border-2 border-gray-400">
                        <Landmark className="h-4 w-4 text-gray-600" />
                      </div>
                      <div className="text-xs text-gray-700">
                        <div className="text-[10px] text-gray-600">
                          Compte bancaire
                        </div>
                        <div className="font-bold text-sm mb-0.5 text-gray-900 uppercase">
                          {selectedTransactionForCheque.compte}
                        </div>
                      </div>
                    </div>
                    <div className="text-left flex gap-4">
                      <div className="text-[10px] text-gray-600 mb-1 font-medium uppercase">
                        Date de règlement: <br />
                        <span className="font-bold text-sm text-gray-900">
                          {formatDate(
                            selectedTransactionForCheque.cheque?.dateReglement
                          ) || "—"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between items-start mb-6 gap-8">
                    <div className="flex-1">
                      <div className="text-[10px] text-gray-600 mb-1 font-medium uppercase tracking-wide">
                        PAYEZ À L&apos;ORDRE DE
                      </div>
                      <div className="text-xl font-extrabold border-b-2 border-gray-900 pb-2 uppercase tracking-wide min-h-[2.5rem] flex items-end">
                        {selectedTransactionForCheque.description?.includes(
                          "bénéficiaire"
                        )
                          ? selectedTransactionForCheque.description
                              .replace(/bénéficiaire\s*:/i, "")
                              .trim()
                          : selectedTransactionForCheque.description?.includes(
                                "DEV"
                              )
                            ? "ste.OUDAOUDOX"
                            : selectedTransactionForCheque.description || "—"}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="border-2 border-gray-900 px-4 py-2 min-w-[150px]">
                        <div className="text-2xl font-extrabold text-gray-900 text-right">
                          {Number(
                            selectedTransactionForCheque.montant
                          ).toFixed(2)}{" "}
                          DH
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mb-6">
                    <div className="text-base font-bold border-b-2 border-gray-900 pb-2 min-h-[2rem] flex items-end tracking-wide">
                      {nombreEnLettres(
                        Number(selectedTransactionForCheque.montant)
                      )}{" "}
                      <span className="ml-2">dirhams</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-end mt-auto pt-4">
                    <div className="flex-1">
                      <div className="text-[10px] text-gray-600 mb-1 font-medium uppercase">
                        Motif :
                      </div>
                      <div className="text-sm font-semibold pb-1 text-gray-800 min-h-[1.5rem]">
                        {selectedTransactionForCheque.lable || "—"}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-dashed border-gray-400">
                    <div className="text-[30px] text-gray-600 font-mono tracking-widest text-center">
                      ⑆ {selectedTransactionForCheque.cheque?.numero || "—"} ⑆
                    </div>
                  </div>
                </div>
              </div>

              <DialogFooter className="pt-4">
                <Button
                  className="rounded-full"
                  variant="outline"
                  onClick={() => {
                    setChequeTraiteDialogOpen(false);
                    setSelectedTransactionForCheque(null);
                  }}
                >
                  Fermer
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {isAdmin && (
        <UpdateTransactionDialog
          isOpen={updateDialog}
          onClose={() => {
            setUpdateDialog(false);
          }}
          transaction={transaction}
        />
      )}
    </>
  );
}
