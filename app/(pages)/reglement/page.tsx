"use client";
import ComboBoxFournisseur from "@/components/comboBox-fournisseurs";
import ComptesRapportDialog from "@/components/comptes-rapport-dialog";
import CustomDateRangePicker from "@/components/customUi/customDateRangePicker";
import CustomPagination from "@/components/customUi/customPagination";
import CustomTooltip from "@/components/customUi/customTooltip";
import { DeleteConfirmationDialog } from "@/components/delete-confirmation-dialog";
import { LoadingDots } from "@/components/loading-dots";
import { Navbar } from "@/components/navbar";
import NewReglementDialog from "@/components/new-reglement";
import { Sidebar } from "@/components/sidebar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
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
  Check,
  FileText,
  Filter,
  Pen,
  Printer,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import toast, { Toaster } from "react-hot-toast";

type Reglement = {
  id: string;
  createdAt: string;
  montant: number;
  compte: string;
  methodePaiement: string;
  dateReglement: string;
  datePrelevement?: string | null;
  motif?: string | null;
  statut: "en_attente" | "paye" | "en_retard" | "annule";
  facture: boolean;
  fournisseur: {
    id: string;
    nom: string;
    email?: string | null;
    telephone?: string | null;
    adresse?: string | null;
    ice?: string | null;
  };
  cheque?: {
    id: string;
    numero?: string | null;
    dateReglement?: string | null;
    datePrelevement?: string | null;
  } | null;
};

// Type pour compatibilité avec le tableau
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
  typeDepense?: string;
  motif?: string;
  cheque?: {
    numero?: string;
    dateReglement?: string;
  };
  facture: boolean;
  statut?: "en_attente" | "paye" | "en_retard" | "annule";
  numeroReglement?: string;
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

const PAGE_SIZE = 10;

const getPrelevementDate = (transaction: Transaction) => {
  // Pour les règlements, utiliser datePrelevement si disponible, sinon dateReglement
  return transaction.date || transaction.cheque?.dateReglement;
};

const getPrelevementChip = (transaction: Transaction) => {
  const targetDate = getPrelevementDate(transaction);
  if (!targetDate) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(targetDate);
  target.setHours(0, 0, 0, 0);

  const diffDays = Math.round(
    (target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (isNaN(diffDays)) return null;

  if (diffDays > 0) {
    return {
      label: `J-${diffDays}`,
      className: "bg-emerald-100 text-emerald-700",
    };
  }

  if (diffDays === 0) {
    return {
      label: "Aujourd'hui",
      className: "bg-amber-100 text-amber-700",
    };
  }

  return {
    label: `J+${Math.abs(diffDays)}`,
    className: "bg-red-100 text-red-700",
  };
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
  const [updateDialog, setUpdateDialog] = useState(false);
  const [filters, setFilters] = useState({
    compte: "all",
    statut: "all",
    methodePaiement: "all",
  });
  const [statuts, setStatuts] = useState<
    Record<string, "en_attente" | "paye" | "en_retard" | "annule">
  >({});
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

  const reglements = useQuery({
    queryKey: [
      "reglements",
      debouncedQuery,
      page,
      filters.statut,
      filters.methodePaiement,
      filters.compte,
      startDate,
      endDate,
      selectedFournisseur,
    ],
    queryFn: async () => {
      const response = await axios.get("/api/reglement", {
        params: {
          page,
          query: debouncedQuery,
          statut: filters.statut === "all" ? undefined : filters.statut,
          methodePaiement:
            filters.methodePaiement === "all"
              ? undefined
              : filters.methodePaiement,
          compte: filters.compte === "all" ? undefined : filters.compte,
          from: startDate,
          to: endDate,
          fournisseurId: selectedFournisseur?.id,
          limit: PAGE_SIZE,
        },
      });
      console.log("reglements: ", response.data.reglements);
      setTotalPages(response.data.totalPages);
      return response.data;
    },
    keepPreviousData: true,
  });

  useEffect(() => {
    if (reglements.data?.totalPages) {
      setTotalPages(reglements.data.totalPages);
    } else {
      setTotalPages(1);
    }
  }, [reglements.data?.totalPages]);

  // Fonction pour mapper Reglement vers Transaction pour le tableau
  const mapReglementToTransaction = (reglement: Reglement): Transaction => {
    // Formater l'ID en numéro de 20 chiffres (prendre les 20 premiers caractères de l'UUID sans tirets)
    const numeroReglement = reglement.id.replace(/-/g, "").substring(0, 20);
    // Utiliser datePrelevement si disponible, sinon dateReglement
    const dateForChip = reglement.datePrelevement || reglement.dateReglement;
    return {
      id: reglement.id,
      createdAt: reglement.createdAt,
      type: "depense", // Les règlements sont toujours des dépenses
      montant: reglement.montant,
      compte: reglement.compte,
      reference: reglement.fournisseur.id,
      lable: `Règlement ${reglement.fournisseur.nom}`,
      description: `bénéficiaire : ${reglement.fournisseur.nom}`,
      methodePaiement: reglement.methodePaiement,
      date: dateForChip, // Utiliser datePrelevement pour le chip si disponible
      motif: reglement.motif || undefined,
      cheque: reglement.cheque
        ? {
            numero: reglement.cheque.numero || undefined,
            dateReglement: reglement.cheque.dateReglement || undefined,
          }
        : undefined,
      facture: reglement.facture,
      statut: reglement.statut,
      numeroReglement: numeroReglement,
    };
  };

  const hasTransactions = (reglements.data?.reglements?.length || 0) > 0;

  const deleteReglement = useMutation({
    mutationFn: async () => {
      const loadingToast = toast.loading("Suppression...");
      try {
        await axios.delete("/api/reglement", {
          params: {
            id: transaction?.id,
          },
        });
        toast(<span>Règlement supprimé avec succès!</span>, {
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
      queryClient.invalidateQueries({ queryKey: ["reglements"] });
      queryClient.invalidateQueries({ queryKey: ["bonLivraison"] });
    },
  });

  const updateStatut = useMutation({
    mutationFn: async ({
      id,
      statut,
    }: {
      id: string;
      statut: "en_attente" | "paye" | "en_retard" | "annule";
    }) => {
      const response = await axios.patch("/api/reglement", {
        id,
        statut,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reglements"] });
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

  const getStatutLabel = (statut?: string) => {
    switch (statut) {
      case "en_attente":
        return "En attente";
      case "paye":
        return "Payé";
      case "en_retard":
        return "En retard";
      case "annule":
        return "Annulé";
      default:
        return "En attente";
    }
  };

  const getStatutColor = (statut?: string) => {
    switch (statut) {
      case "en_attente":
        return "bg-amber-100 text-amber-700";
      case "paye":
        return "bg-green-100 text-green-700";
      case "en_retard":
        return "bg-red-100 text-red-700";
      case "annule":
        return "bg-gray-100 text-gray-700";
      default:
        return "bg-amber-100 text-amber-700";
    }
  };

  const handleChangeStatut = (
    reglementId: string,
    newStatut: "en_attente" | "paye" | "en_retard" | "annule"
  ) => {
    // Mettre à jour l'état local immédiatement pour un feedback visuel instantané
    setStatuts(prev => ({
      ...prev,
      [reglementId]: newStatut,
    }));

    // Appeler la mutation pour persister le changement en base de données
    updateStatut.mutate(
      { id: reglementId, statut: newStatut },
      {
        onSuccess: () => {
          toast.success(
            `Statut changé en "${getStatutLabel(newStatut)}" avec succès`
          );
        },
        onError: (error: any) => {
          // En cas d'erreur, restaurer l'état précédent
          setStatuts(prev => {
            const updated = { ...prev };
            delete updated[reglementId];
            return updated;
          });
          toast.error(
            error?.response?.data?.error || "Échec de la mise à jour du statut"
          );
        },
      }
    );
  };

  const formatNumeroReglement = (numero?: string) => {
    if (!numero) return "—";
    if (numero.length <= 12) return numero;
    // Afficher les 8 premiers et 4 derniers chiffres
    return `${numero.substring(0, 8)}...${numero.substring(numero.length - 4)}`;
  };

  const handleChequeClick = (transaction: Transaction) => {
    if (transaction.methodePaiement === "cheque") {
      let beneficiaire = "Inconnu";
      if (transaction.description.includes("bénéficiaire")) {
        beneficiaire = transaction.description
          ?.replace(/bénéficiaire\s*:/i, "") // plus flexible
          .trim();
      } else if (transaction.description.includes("DEV")) {
        beneficiaire = "ste.OUDAOUDOX ";
      }

      const numeroCheque = transaction.cheque?.numero || "Inconnu";
      const montant = transaction.montant || "Inconnu";
      const dateRegelemen = transaction.cheque?.dateReglement || "Inconnu";
      const compte = transaction.compte || "Inconnu";

      toast(
        t => (
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
                  <h1 className="text-3xl font-bold">Réglements</h1>
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
                      {reglements.isFetching && !reglements.isLoading && (
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
                              htmlFor="statut"
                              className="text-left text-black"
                            >
                              Statut :
                            </Label>
                            <Select
                              value={filters.statut}
                              name="statut"
                              onValueChange={value =>
                                setFilters({ ...filters, statut: value })
                              }
                            >
                              <SelectTrigger className="col-span-3 bg-white focus:ring-purple-500">
                                <SelectValue placeholder="Séléctionner un statut" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">
                                  Tous les statuts
                                </SelectItem>
                                <SelectItem value="en_attente">
                                  <div className="flex items-center gap-2">
                                    <span
                                      className={`h-2 w-2 shadow-md rounded-full bg-amber-500`}
                                    />
                                    En attente
                                  </div>
                                </SelectItem>
                                <SelectItem value="paye">
                                  <div className="flex items-center gap-2">
                                    <span
                                      className={`h-2 w-2 rounded-full bg-green-500`}
                                    />
                                    Payé
                                  </div>
                                </SelectItem>
                                <SelectItem value="en_retard">
                                  <div className="flex items-center gap-2">
                                    <span
                                      className={`h-2 w-2 rounded-full bg-red-500`}
                                    />
                                    En retard
                                  </div>
                                </SelectItem>
                                <SelectItem value="annule">
                                  <div className="flex items-center gap-2">
                                    <span
                                      className={`h-2 w-2 rounded-full bg-gray-500`}
                                    />
                                    Annulé
                                  </div>
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="grid items-center gap-3 my-2">
                            <Label
                              htmlFor="type"
                              className="text-left text-black"
                            >
                              Méthode de paiement :
                            </Label>
                            <Select
                              value={filters.methodePaiement}
                              name="methodePaiement"
                              onValueChange={value =>
                                setFilters({
                                  ...filters,
                                  methodePaiement: value,
                                })
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
                            <Label
                              htmlFor="compte"
                              className="text-left text-black"
                            >
                              Compte :
                            </Label>
                            <Select
                              value={filters.compte}
                              name="compte"
                              onValueChange={value =>
                                setFilters({ ...filters, compte: value })
                              }
                            >
                              <SelectTrigger className="col-span-3 bg-white focus:ring-purple-500">
                                <SelectValue placeholder="Séléctionner un statut" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">
                                  Tous les comptes
                                </SelectItem>
                                {comptes.data?.map(
                                  (element: Compte, index: number) => (
                                    <SelectItem
                                      key={index}
                                      value={element.compte}
                                    >
                                      {element.compte}
                                    </SelectItem>
                                  )
                                )}
                              </SelectContent>
                            </Select>
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
                          statut: filters.statut,
                          compte: filters.compte,
                          methodePaiement: filters.methodePaiement,
                          from: startDate,
                          to: endDate,
                          fournisseurId: selectedFournisseur?.id,
                        };
                        localStorage.setItem("params", JSON.stringify(params));
                        window.open("/reglement/impression", "_blank");
                      }}
                      className="border-purple-500 bg-purple-100 text-purple-700 hover:bg-purple-200 hover:text-purple-900 rounded-full"
                    >
                      <Printer className="h-4 w-4" />
                      Imprimer
                    </Button>
                    <NewReglementDialog />
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
                            <TableHead className="w-[150px]">
                              Date de création
                            </TableHead>
                            <TableHead>Date de prélèvement</TableHead>
                            <TableHead>Fournisseur</TableHead>
                            <TableHead>Montant</TableHead>
                            <TableHead>Méthode</TableHead>
                            <TableHead>Compte</TableHead>
                            <TableHead>Statut</TableHead>
                            <TableHead>Numéro</TableHead>
                            <TableHead>Facture</TableHead>
                            <TableHead>motif</TableHead>
                            <TableHead className="text-center">
                              Actions
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {reglements.isLoading ? (
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
                                <TableCell className="!py-2" align="left">
                                  <Skeleton className="h-4 w-[100px]" />
                                </TableCell>
                                <TableCell className="!py-2" align="left">
                                  <Skeleton className="h-4 w-[80px]" />
                                </TableCell>
                                <TableCell className="!py-2" align="center">
                                  <Skeleton className="h-5 w-5 rounded-full mx-auto" />
                                </TableCell>
                                <TableCell className="!py-2" align="left">
                                  <Skeleton className="h-4 w-[120px]" />
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
                          ) : hasTransactions ? (
                            reglements.data?.reglements?.map(
                              (reglement: Reglement) => {
                                const transaction =
                                  mapReglementToTransaction(reglement);
                                const prelevementChip =
                                  getPrelevementChip(transaction);
                                const prelevementDate =
                                  getPrelevementDate(transaction);
                                return (
                                  <TableRow key={reglement.id}>
                                    <TableCell className="font-medium py-1">
                                      {formatDate(reglement.dateReglement) ||
                                        "—"}
                                    </TableCell>
                                    <TableCell className="font-medium py-0">
                                      <div className="flex items-center gap-2">
                                        <span>
                                          {formatDate(
                                            reglement.datePrelevement
                                          ) || "—"}
                                        </span>
                                        {prelevementChip && (
                                          <Badge
                                            className={`text-xs font-medium ${prelevementChip.className}`}
                                          >
                                            {prelevementChip.label}
                                          </Badge>
                                        )}
                                      </div>
                                    </TableCell>
                                    <TableCell className="font-medium py-0">
                                      {reglement.fournisseur.nom || "—"}
                                    </TableCell>
                                    <TableCell className="font-medium py-0">
                                      {formatCurrency(transaction.montant)}
                                    </TableCell>
                                    <TableCell
                                      onClick={() =>
                                        handleChequeClick(transaction)
                                      }
                                      className={`font-medium py-0 ${
                                        transaction.methodePaiement ===
                                          "cheque" && "cursor-pointer"
                                      }`}
                                    >
                                      {methodePaiementLabel(transaction)}
                                    </TableCell>
                                    <TableCell className="font-medium py-0">
                                      {transaction.compte}
                                    </TableCell>
                                    <TableCell className="font-medium py-0">
                                      <Select
                                        value={
                                          statuts[reglement.id] ||
                                          reglement.statut ||
                                          "en_attente"
                                        }
                                        onValueChange={value =>
                                          handleChangeStatut(
                                            reglement.id,
                                            value as
                                              | "en_attente"
                                              | "paye"
                                              | "en_retard"
                                              | "annule"
                                          )
                                        }
                                      >
                                        <SelectTrigger className="h-8 w-[130px] text-xs border-0 bg-transparent hover:bg-gray-50">
                                          <SelectValue>
                                            <span
                                              className={`text-xs px-2 py-1 rounded-full ${getStatutColor(
                                                statuts[reglement.id] ||
                                                  reglement.statut
                                              )}`}
                                            >
                                              {getStatutLabel(
                                                statuts[reglement.id] ||
                                                  reglement.statut
                                              )}
                                            </span>
                                          </SelectValue>
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="en_attente">
                                            <span className="flex items-center gap-2">
                                              <span className="h-2 w-2 rounded-full bg-amber-500"></span>
                                              En attente
                                            </span>
                                          </SelectItem>
                                          <SelectItem value="paye">
                                            <span className="flex items-center gap-2">
                                              <span className="h-2 w-2 rounded-full bg-green-500"></span>
                                              Payé
                                            </span>
                                          </SelectItem>
                                          <SelectItem value="en_retard">
                                            <span className="flex items-center gap-2">
                                              <span className="h-2 w-2 rounded-full bg-red-500"></span>
                                              En retard
                                            </span>
                                          </SelectItem>
                                          <SelectItem value="annule">
                                            <span className="flex items-center gap-2">
                                              <span className="h-2 w-2 rounded-full bg-gray-500"></span>
                                              Annulé
                                            </span>
                                          </SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </TableCell>
                                    <TableCell className="font-medium py-0">
                                      {transaction.numeroReglement ? (
                                        <CustomTooltip
                                          message={transaction.numeroReglement}
                                        >
                                          <span className="cursor-help">
                                            {formatNumeroReglement(
                                              transaction.numeroReglement
                                            )}
                                          </span>
                                        </CustomTooltip>
                                      ) : (
                                        transaction.cheque?.numero || "—"
                                      )}
                                    </TableCell>
                                    <TableCell className="font-medium py-0 text-center">
                                      {transaction.facture ? (
                                        <Check className="h-5 w-5 text-green-500" />
                                      ) : (
                                        <X className="h-5 w-5 text-red-500" />
                                      )}
                                    </TableCell>
                                    <TableCell className="font-medium py-0">
                                      {transaction.motif || "—"}
                                    </TableCell>
                                    <TableCell className="text-right py-2">
                                      <div className="flex justify-end gap-2">
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
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-8 w-8 rounded-full hover:bg-blue-100 hover:text-blue-600"
                                          title="Créer une facture"
                                        >
                                          <FileText className="h-4 w-4" />
                                          <span className="sr-only">
                                            Créer une facture
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
                              <TableCell colSpan={11} className="text-center">
                                Aucun réglement trouvé
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
        recordName={"le règlement"}
        isOpen={deleteDialog}
        onClose={() => {
          setDeleteDialog(false);
        }}
        onConfirm={() => {
          deleteReglement.mutate();
          setDeleteDialog(false);
        }}
      />

      <UpdateTransactionDialog
        isOpen={updateDialog}
        onClose={() => {
          setUpdateDialog(false);
        }}
        transaction={transaction}
      />
    </>
  );
}
