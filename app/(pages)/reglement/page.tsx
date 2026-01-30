"use client";

import ComboBoxFournisseur from "@/components/comboBox-fournisseurs";
import CreatefactureAchatsDialog from "@/components/create-facture-societe-dialog";
import CustomDateRangePicker from "@/components/customUi/customDateRangePicker";
import CustomPagination from "@/components/customUi/customPagination";
import { PriceRangeSlider } from "@/components/customUi/customSlider";
import { DeleteConfirmationDialog } from "@/components/delete-confirmation-dialog";
import { LoadingDots } from "@/components/loading-dots";
import { Navbar } from "@/components/navbar";
import NewReglementDialog from "@/components/new-reglement";
import { PrelevementConfirmationDialog } from "@/components/prelevement-confirmation-dialog";
import { Sidebar } from "@/components/sidebar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
import UpdateReglementDialog from "@/components/update-reglement";
import {
  formatCurrency,
  formatDate,
  methodePaiementLabel,
} from "@/lib/functions";
import { useUser } from "@clerk/nextjs";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import {
  ArrowUp,
  CalendarClock,
  ChevronDown,
  Columns,
  FileText,
  Filter,
  History,
  LandmarkIcon,
  MoreVertical,
  Pen,
  Printer,
  Search,
  Trash2,
  Wallet,
  X,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import toast, { Toaster } from "react-hot-toast";

type Reglement = {
  id: string;
  createdAt: string;
  montant: number;
  compte: string;
  methodePaiement: string;
  dateReglement: string;
  datePrelevement?: string | null;
  statusPrelevement?:
    | "en_attente"
    | "confirme"
    | "echoue"
    | "reporte"
    | "refuse";
  motif?: string | null;
  statut: "en_attente" | "paye" | "en_retard" | "annule";
  factureAchatsId?: string | null;
  factureAchats?: {
    id: string;
    numero: string | null;
  } | null;
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

// Type pour compatibilité avec le tableau et le composant UpdateReglementDialog
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
  dateReglement?: string;
  datePrelevement?: string | null;
  typeDepense?: string;
  motif?: string;
  cheque?: {
    numero?: string;
    dateReglement?: string;
    datePrelevement?: string | null;
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

// Valeurs par défaut pour la visibilité des colonnes (toutes visibles par défaut)
const defaultVisibleColumns = {
  dateCreation: true,
  datePrelevement: true,
  fournisseur: true,
  montant: true,
  methode: true,
  compte: true,
  statut: true,
  numero: true,
  facture: true,
  motif: true,
  actions: true, // Actions toujours visible
};

// Configuration des colonnes avec leurs labels
const columnDefinitions = [
  { key: "dateCreation", label: "Date de création" },
  { key: "datePrelevement", label: "Date de prélèvement" },
  { key: "fournisseur", label: "Fournisseur" },
  { key: "montant", label: "Montant" },
  { key: "methode", label: "Méthode" },
  { key: "compte", label: "Compte" },
  { key: "statut", label: "Statut" },
  { key: "numero", label: "Numéro" },
  { key: "facture", label: "Facture" },
  { key: "motif", label: "Motif" },
];

const getPrelevementDate = (reglement: Reglement) => {
  // Pour les règlements, utiliser datePrelevement si disponible, sinon dateReglement
  return reglement.datePrelevement || reglement.cheque?.dateReglement;
};

// Fonction pour convertir un nombre en lettres (pour le montant du chèque)
const nombreEnLettres = (n: number): string => {
  const unites = [
    "",
    "un",
    "deux",
    "trois",
    "quatre",
    "cinq",
    "six",
    "sept",
    "huit",
    "neuf",
  ];
  const dizaines = [
    "",
    "dix",
    "vingt",
    "trente",
    "quarante",
    "cinquante",
    "soixante",
  ];
  const dizainesSpeciales = [
    "dix",
    "onze",
    "douze",
    "treize",
    "quatorze",
    "quinze",
    "seize",
  ];

  function convertMoinsDeCent(n: number): string {
    if (n < 10) return unites[n];
    if (n < 17) return dizainesSpeciales[n - 10];
    if (n < 20) return "dix-" + unites[n - 10];
    if (n < 70) {
      const dizaine = Math.floor(n / 10);
      const unite = n % 10;
      return (
        dizaines[dizaine] +
        (unite === 1 ? "-et-un" : unite > 0 ? "-" + unites[unite] : "")
      );
    }
    if (n < 80) return "soixante-" + convertMoinsDeCent(n - 60);
    if (n < 100)
      return (
        "quatre-vingt" + (n === 80 ? "s" : "-" + convertMoinsDeCent(n - 80))
      );
    return "";
  }

  function convertMoinsDeMille(n: number): string {
    if (n < 100) return convertMoinsDeCent(n);
    const centaine = Math.floor(n / 100);
    const reste = n % 100;
    return (
      (centaine === 1
        ? "cent"
        : unites[centaine] + " cent" + (reste === 0 ? "s" : "")) +
      (reste > 0 ? " " + convertMoinsDeCent(reste) : "")
    );
  }

  function convertir(n: number): string {
    if (n === 0) return "zéro";
    if (n < 1000) return convertMoinsDeMille(n);
    const mille = Math.floor(n / 1000);
    const reste = n % 1000;
    return (
      (mille === 1 ? "mille" : convertMoinsDeMille(mille) + " mille") +
      (reste > 0 ? " " + convertMoinsDeMille(reste) : "")
    );
  }

  return convertir(Math.floor(n)).trim();
};

const getPrelevementChip = (reglement: Reglement) => {
  // Afficher le badge uniquement si la date de prélèvement existe
  if (!reglement.datePrelevement || reglement.statusPrelevement === "confirme")
    return null;

  const targetDate = reglement.datePrelevement;
  if (!targetDate) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(targetDate);
  target.setHours(0, 0, 0, 0);

  const diffDays = Math.round(
    (target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (isNaN(diffDays)) return null;

  // Afficher uniquement la différence en jours
  if (diffDays > 0) {
    return {
      label: `+${diffDays} J`,
      className: "bg-emerald-100 text-emerald-700",
    };
  }

  if (diffDays === 0) {
    return {
      label: "Aujourd'hui",
      className: "bg-amber-100 text-amber-700",
    };
  }

  // En retard (date passée)
  const joursRetard = Math.abs(diffDays);
  return {
    label: `${diffDays} J`,
    className: "bg-red-100 text-red-700",
  };
};
function ReglementContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useUser();
  const isAdmin = user?.publicMetadata?.role === "admin";
  const [searchQuery, setSearchQuery] = useState("");
  const [reglementForTable, setReglementForTable] = useState<
    Transaction | undefined
  >();
  const [deleteDialog, setDeleteDialog] = useState<boolean>(false);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>();
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [startDatePrelevement, setStartDatePrelevement] = useState<Date>();
  const [endDatePrelevement, setEndDatePrelevement] = useState<Date>();
  const [maxMontant, setMaxMontant] = useState<number>(0);
  const [selectedFournisseur, setSelectedFournisseur] =
    useState<Fournisseur | null>();
  const [updateDialog, setUpdateDialog] = useState(false);
  const [factureDialog, setFactureDialog] = useState(false);
  const [reglementForFacture, setReglementForFacture] =
    useState<Reglement | null>(null);
  const [filters, setFilters] = useState({
    compte: [] as string[],
    statut: "all",
    methodePaiement: [] as string[],
    statusPrelevement: [] as string[],
    montant: [0, 0] as [number, number],
  });
  const [statusPrelevements, setStatusPrelevements] = useState<
    Record<string, "en_attente" | "confirme" | "echoue" | "reporte" | "refuse">
  >({});
  const [statutChangeDialog, setStatutChangeDialog] = useState(false);
  const [pendingStatutChange, setPendingStatutChange] = useState<{
    id: string;
    currentStatut: string;
    newStatut: "en_attente" | "confirme" | "echoue" | "reporte" | "refuse";
    fournisseurNom?: string;
  } | null>(null);
  const [prelevementDialogOpen, setPrelevementDialogOpen] = useState(false);
  const [selectedReglementForPrelevement, setSelectedReglementForPrelevement] =
    useState<Reglement | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [chequeDialogOpen, setChequeDialogOpen] = useState(false);
  const [selectedReglementForCheque, setSelectedReglementForCheque] =
    useState<Reglement | null>(null);
  const [balanceDialogOpen, setBalanceDialogOpen] = useState(false);
  const [balanceStartDate, setBalanceStartDate] = useState<string | undefined>();
  const [balanceEndDate, setBalanceEndDate] = useState<string | undefined>();
  const [balanceStep, setBalanceStep] = useState<"period" | "results">("period");
  const [versementDialogOpen, setVersementDialogOpen] = useState(false);
  const [versementMontant, setVersementMontant] = useState<string>("");
  const [versementSourceCompteId, setVersementSourceCompteId] = useState<string>("");
  const [versementReference, setVersementReference] = useState<string>("");
  const [versementNote, setVersementNote] = useState<string>("");
  const [versementHistoryPage, setVersementHistoryPage] = useState(1);
  const queryClient = useQueryClient();

  // État pour la visibilité des colonnes
  const [visibleColumns, setVisibleColumns] = useState(defaultVisibleColumns);
  const [isColumnsLoaded, setIsColumnsLoaded] = useState(false);

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
    filters.statut,
    filters.methodePaiement,
    filters.compte,
    filters.statusPrelevement,
    filters.montant,
    startDate,
    endDate,
    startDatePrelevement,
    endDatePrelevement,
    selectedFournisseur,
  ]);

  const reglements = useQuery({
    queryKey: [
      "reglements",
      debouncedQuery,
      page,
      filters.statut,
      filters.methodePaiement,
      filters.compte,
      filters.statusPrelevement,
      filters.montant,
      startDate,
      endDate,
      startDatePrelevement,
      endDatePrelevement,
      selectedFournisseur,
    ],
    queryFn: async () => {
      const response = await axios.get("/api/reglement", {
        params: {
          page,
          query: debouncedQuery,
          statut: filters.statut === "all" ? undefined : filters.statut,
          methodePaiement:
            filters.methodePaiement.length > 0
              ? filters.methodePaiement.join(",")
              : undefined,
          compte:
            filters.compte.length > 0
              ? filters.compte.join(",")
              : undefined,
          statusPrelevement:
            filters.statusPrelevement.length > 0
              ? filters.statusPrelevement.join(",")
              : undefined,
          from: startDate,
          to: endDate,
          fromPrelevement: startDatePrelevement,
          toPrelevement: endDatePrelevement,
          minMontant: filters.montant[0] > 0 ? filters.montant[0] : undefined,
          maxMontant:
            filters.montant[1] < maxMontant ? filters.montant[1] : undefined,
          fournisseurId: selectedFournisseur?.id,
          limit: PAGE_SIZE,
        },
      });
      console.log("reglements: ", response.data.reglements);
      setTotalPages(response.data.totalPages);

      // Calculer le montant maximum depuis les données
      if (response.data.reglements && response.data.reglements.length > 0) {
        const max = Math.max(
          ...response.data.reglements.map((r: Reglement) => r.montant)
        );
        if (max > maxMontant) {
          setMaxMontant(Math.ceil(max / 100) * 100); // Arrondir à la centaine supérieure
        }
      }

      return response.data;
    },
    keepPreviousData: true,
  });

  // Initialiser le filtre de montant quand maxMontant est disponible
  useEffect(() => {
    if (maxMontant > 0 && filters.montant[1] === 0) {
      setFilters(prev => ({ ...prev, montant: [0, maxMontant] }));
    }
  }, [maxMontant, filters.montant]);

  // Charger les préférences de colonnes depuis localStorage
  useEffect(() => {
    if (typeof window !== "undefined" && !isColumnsLoaded) {
      const saved = localStorage.getItem("reglement-visible-columns");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          // S'assurer que toutes les colonnes sont présentes
          setVisibleColumns({ ...defaultVisibleColumns, ...parsed });
        } catch (e) {
          console.error("Error parsing visible columns from localStorage:", e);
        }
      }
      setIsColumnsLoaded(true);
    }
  }, [isColumnsLoaded]);

  // Sauvegarder les préférences de colonnes dans localStorage
  useEffect(() => {
    if (isColumnsLoaded && typeof window !== "undefined") {
      localStorage.setItem(
        "reglement-visible-columns",
        JSON.stringify(visibleColumns)
      );
    }
  }, [visibleColumns, isColumnsLoaded]);

  // Fonction pour toggle la visibilité d'une colonne
  const toggleColumn = (columnKey: string) => {
    setVisibleColumns(prev => ({
      ...prev,
      [columnKey]: !prev[columnKey as keyof typeof prev],
    }));
  };

  useEffect(() => {
    if (reglements.data?.totalPages) {
      setTotalPages(reglements.data.totalPages);
    } else {
      setTotalPages(1);
    }
  }, [reglements.data?.totalPages]);

  // Removed automatic toast notification - notifications are now handled by the navbar notification icon

  // Handle URL parameter to open prelevement dialog
  useEffect(() => {
    const prelevementId = searchParams.get("prelevement");
    if (prelevementId && reglements.data?.reglements) {
      // Seul l'admin peut ouvrir le dialog de prélèvement via URL
      if (!isAdmin) {
        router.replace("/reglement", { scroll: false });
        return;
      }
      const reglement = reglements.data.reglements.find(
        (r: Reglement) => r.id === prelevementId
      );
      if (reglement && reglement.datePrelevement) {
        setSelectedReglementForPrelevement(reglement);
        setPrelevementDialogOpen(true);
        // Remove the parameter from URL
        router.replace("/reglement", { scroll: false });
      }
    }
  }, [searchParams, reglements.data, router, isAdmin]);

  // Fonction pour mapper Reglement vers format tableau
  const mapReglementForTable = (reglement: Reglement): Transaction => {
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
      dateReglement: reglement.dateReglement,
      datePrelevement: reglement.datePrelevement,
      motif: reglement.motif || undefined,
      cheque: reglement.cheque
        ? {
            numero: reglement.cheque.numero || undefined,
            dateReglement: reglement.cheque.dateReglement || undefined,
            datePrelevement: reglement.cheque.datePrelevement || undefined,
          }
        : undefined,
      facture: !!reglement.factureAchatsId || !!reglement.factureAchats,
      statut: reglement.statut,
      numeroReglement: numeroReglement,
    };
  };

  const hasReglements = (reglements.data?.reglements?.length || 0) > 0;

  const deleteReglement = useMutation({
    mutationFn: async () => {
      if (!isAdmin) {
        toast.error("Accès refusé: seul l'admin peut supprimer un règlement.");
        return;
      }
      const loadingToast = toast.loading("Suppression...");
      try {
        await axios.delete("/api/reglement", {
          params: {
            id: reglementForTable?.id,
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
      // Invalider aussi les notifications de prélèvements
      queryClient.invalidateQueries({ queryKey: ["today-prelevements"] });
    },
  });

  const updateStatusPrelevement = useMutation({
    mutationFn: async ({
      id,
      statusPrelevement,
    }: {
      id: string;
      statusPrelevement:
        | "en_attente"
        | "confirme"
        | "echoue"
        | "reporte"
        | "refuse";
    }) => {
      if (!isAdmin) {
        throw new Error("Access denied. Admin role required.");
      }
      const response = await axios.patch("/api/reglement", {
        id,
        statusPrelevement,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reglements"] });
      // Invalider aussi les notifications de prélèvements
      queryClient.invalidateQueries({ queryKey: ["today-prelevements"] });
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

  // Query pour la balance
  const balanceQuery = useQuery({
    queryKey: ["balance", balanceStartDate, balanceEndDate],
    queryFn: async () => {
      if (!balanceStartDate || !balanceEndDate) return null;
      const response = await axios.get("/api/reglement/balance", {
        params: {
          fromPrelevement: balanceStartDate,
          toPrelevement: balanceEndDate,
        },
      });
      return response.data;
    },
    enabled: balanceStep === "results" && !!balanceStartDate && !!balanceEndDate,
  });

  // Query pour récupérer le compte professionnel
  const compteProQuery = useQuery({
    queryKey: ["comptePro"],
    queryFn: async () => {
      const response = await axios.get("/api/comptesBancaires");
      const comptes = response.data.comptes;
      const comptePro = comptes.find(
        (c: { compte: string }) => c.compte.toLowerCase() === "compte professionnel"
      );
      return comptePro;
    },
  });

  // Query pour l'historique des versements
  const versementsHistoryQuery = useQuery({
    queryKey: ["versements", versementHistoryPage],
    queryFn: async () => {
      const response = await axios.get("/api/versements", {
        params: {
          page: versementHistoryPage,
          limit: 10,
        },
      });
      return response.data;
    },
    enabled: versementDialogOpen,
  });

  // Mutation pour créer un versement
  const createVersementMutation = useMutation({
    mutationFn: async (data: {
      montant: number;
      sourceCompteId: string;
      compteProId: string;
      reference?: string;
      note?: string;
    }) => {
      const response = await axios.post("/api/versements", data);
      return response.data;
    },
    onSuccess: () => {
      toast.success("Versement effectué avec succès");
      setVersementDialogOpen(false);
      setVersementMontant("");
      setVersementSourceCompteId("");
      setVersementReference("");
      setVersementNote("");
      queryClient.invalidateQueries({ queryKey: ["versements"] });
      queryClient.invalidateQueries({ queryKey: ["comptes"] });
      queryClient.invalidateQueries({ queryKey: ["comptePro"] });
      queryClient.invalidateQueries({ queryKey: ["statistiques"] });
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.error || "Erreur lors du versement"
      );
    },
  });

  const _handleTypeLableColor = (t: String) => {
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

  const _getStatutLabel = (statut?: string) => {
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

  const _getStatutColor = (statut?: string) => {
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

  const getStatusPrelevementLabel = (statusPrelevement?: string | null) => {
    switch (statusPrelevement) {
      case "en_attente":
        return "En attente";
      case "confirme":
        return "Confirmé";
      case "echoue":
        return "Échoué";
      case "reporte":
        return "Reporté";
      case "refuse":
        return "Refusé";
      default:
        return "—";
    }
  };

  const getStatusPrelevementColor = (statusPrelevement?: string | null) => {
    switch (statusPrelevement) {
      case "en_attente":
        return "bg-amber-100 text-amber-700";
      case "confirme":
        return "bg-green-100 text-green-700";
      case "echoue":
        return "bg-red-100 text-red-700";
      case "reporte":
        return "bg-amber-100 text-amber-700";
      case "refuse":
        return "bg-gray-100 text-gray-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  // Statuts disponibles pour le filtre
  const statusPrelevementOptions = [
    { value: "en_attente", label: "En attente", color: "amber-500" },
    { value: "confirme", label: "Confirmé", color: "green-500" },
    { value: "echoue", label: "Échoué", color: "red-500" },
    { value: "reporte", label: "Reporté", color: "amber-500" },
    { value: "refuse", label: "Refusé", color: "gray-500" },
  ];

  // Fonctions pour gérer les statuts de prélèvement multiples
  const handleStatusPrelevementChange = (
    statusPrelevement: string,
    checked: boolean
  ) => {
    setFilters(prev => ({
      ...prev,
      statusPrelevement: checked
        ? [...prev.statusPrelevement, statusPrelevement]
        : prev.statusPrelevement.filter(s => s !== statusPrelevement),
    }));
  };

  const removeStatusPrelevement = (statusPrelevement: string) => {
    setFilters(prev => ({
      ...prev,
      statusPrelevement: prev.statusPrelevement.filter(
        s => s !== statusPrelevement
      ),
    }));
  };

  // Options pour méthode de paiement
  const methodePaiementOptions = [
    { value: "espece", label: "Espèce" },
    { value: "versement", label: "Versement" },
    { value: "cheque", label: "Chèque" },
    { value: "traite", label: "Traite" },
  ];

  // Fonctions pour gérer les méthodes de paiement multiples
  const handleMethodePaiementChange = (
    methodePaiement: string,
    checked: boolean
  ) => {
    setFilters(prev => ({
      ...prev,
      methodePaiement: checked
        ? [...prev.methodePaiement, methodePaiement]
        : prev.methodePaiement.filter(m => m !== methodePaiement),
    }));
  };

  const removeMethodePaiement = (methodePaiement: string) => {
    setFilters(prev => ({
      ...prev,
      methodePaiement: prev.methodePaiement.filter(
        m => m !== methodePaiement
      ),
    }));
  };

  // Fonctions pour gérer les comptes multiples
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

  const handleChangeStatusPrelevement = (
    reglementId: string,
    newStatusPrelevement:
      | "en_attente"
      | "confirme"
      | "echoue"
      | "reporte"
      | "refuse",
    currentStatusPrelevement:
      | "en_attente"
      | "confirme"
      | "echoue"
      | "reporte"
      | "refuse"
      | null
      | undefined,
    fournisseurNom?: string,
    datePrelevement?: string | null
  ) => {
    // Vérifier que le règlement a une date de prélèvement
    if (!datePrelevement) {
      toast.error(
        "Impossible de changer le statut : le règlement n'a pas de date de prélèvement"
      );
      return;
    }

    // Stocker le changement en attente et ouvrir le dialog
    setPendingStatutChange({
      id: reglementId,
      currentStatut: getStatusPrelevementLabel(currentStatusPrelevement),
      newStatut: newStatusPrelevement,
      fournisseurNom: fournisseurNom,
    });
    setStatutChangeDialog(true);
  };

  const confirmStatutChange = () => {
    if (!pendingStatutChange) return;

    // Mettre à jour l'état local immédiatement pour un feedback visuel instantané
    setStatusPrelevements(prev => ({
      ...prev,
      [pendingStatutChange.id]: pendingStatutChange.newStatut,
    }));

    // Appeler la mutation pour persister le changement en base de données
    updateStatusPrelevement.mutate(
      {
        id: pendingStatutChange.id,
        statusPrelevement: pendingStatutChange.newStatut,
      },
      {
        onSuccess: () => {
          toast.success(
            `Statut changé en "${getStatusPrelevementLabel(
              pendingStatutChange.newStatut
            )}" avec succès`
          );
          setStatutChangeDialog(false);
          setPendingStatutChange(null);
        },
        onError: (error: any) => {
          // En cas d'erreur, restaurer l'état précédent
          setStatusPrelevements(prev => {
            const updated = { ...prev };
            delete updated[pendingStatutChange.id];
            return updated;
          });
          toast.error(
            error?.response?.data?.error || "Échec de la mise à jour du statut"
          );
          setStatutChangeDialog(false);
          setPendingStatutChange(null);
        },
      }
    );
  };

  const _formatNumeroReglement = (numero?: string) => {
    if (!numero) return "—";
    if (numero.length <= 12) return numero;
    // Afficher les 8 premiers et 4 derniers chiffres
    return `${numero.substring(0, 8)}...${numero.substring(numero.length - 4)}`;
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
                    <Button
                      variant="outline"
                      onClick={() => {
                        setVersementDialogOpen(true);
                      }}
                      className="border-green-500 bg-green-100 text-green-700 hover:bg-green-200 hover:text-green-900 rounded-full"
                    >
                      <ArrowUp className="mr-2 h-4 w-4" />
                      Versement vers compte pro
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setBalanceDialogOpen(true);
                        setBalanceStep("period");
                        setBalanceStartDate(undefined);
                        setBalanceEndDate(undefined);
                      }}
                      className="border-purple-500 bg-purple-100 text-purple-700 hover:bg-purple-200 hover:text-purple-900 rounded-full"
                    >
                      <Wallet className="mr-2 h-4 w-4" />
                      Balance
                    </Button>
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
                            règlements.
                          </SheetDescription>
                        </SheetHeader>
                        <div className="grid gap-4 py-4">
                          {/* <div className="grid items-center gap-3 my-2">
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
                          </div> */}
                            <div className="grid grid-rows-2 grid-cols-4 items-center my-2">
                            <Label
                              htmlFor="statusPrelevement"
                              className="text-left text-black col-span-4"
                            >
                              Statut de prélèvement :
                            </Label>
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  className="col-span-4 justify-between text-left font-normal focus:ring-2 focus:ring-purple-500 bg-white"
                                >
                                  <div className="flex flex-wrap gap-1">
                                    {filters.statusPrelevement.length === 0 ? (
                                      <span className="text-muted-foreground">
                                        Sélectionner les statuts
                                      </span>
                                    ) : (
                                      filters.statusPrelevement.map(statut => {
                                        const option = statusPrelevementOptions.find(
                                          opt => opt.value === statut
                                        );
                                        return (
                                          <Badge
                                            key={statut}
                                            variant="secondary"
                                            className={`text-xs ${
                                              statut === "en_attente"
                                                ? "bg-amber-100 text-amber-800 hover:bg-amber-200"
                                                : statut === "confirme"
                                                ? "bg-green-100 text-green-800 hover:bg-green-200"
                                                : statut === "echoue"
                                                ? "bg-red-100 text-red-800 hover:bg-red-200"
                                                : statut === "reporte"
                                                ? "bg-amber-100 text-amber-800 hover:bg-amber-200"
                                                : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                                            }`}
                                          >
                                            {option?.label || statut}
                                            <X
                                              className="ml-1 h-3 w-3 cursor-pointer hover:text-purple-600"
                                              onClick={e => {
                                                e.stopPropagation();
                                                removeStatusPrelevement(statut);
                                              }}
                                            />
                                          </Badge>
                                        );
                                      })
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
                                  {statusPrelevementOptions.map(
                                    (statut, index) => (
                                      <div
                                        key={index}
                                        className="flex items-center space-x-2"
                                      >
                                        <Checkbox
                                          id={`statusPrelevement-${statut.value}`}
                                          checked={filters.statusPrelevement.includes(
                                            statut.value
                                          )}
                                          onCheckedChange={checked =>
                                            handleStatusPrelevementChange(
                                              statut.value,
                                              checked as boolean
                                            )
                                          }
                                        />
                                        <Label
                                          htmlFor={`statusPrelevement-${statut.value}`}
                                          className="text-sm font-medium cursor-pointer flex items-center gap-2"
                                        >
                                          <span
                                            className={`h-2 w-2 rounded-full bg-${statut.color}`}
                                          />
                                          {statut.label}
                                        </Label>
                                      </div>
                                    )
                                  )}
                                </div>
                              </PopoverContent>
                            </Popover>
                          </div>
                          <div className="grid grid-rows-2 grid-cols-4 items-center my-2">
                            <Label
                              htmlFor="methodePaiement"
                              className="text-left text-black col-span-4"
                            >
                              Méthode de paiement :
                            </Label>
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  className="col-span-4 justify-between text-left font-normal focus:ring-2 focus:ring-purple-500 bg-white"
                                >
                                  <div className="flex flex-wrap gap-1">
                                    {filters.methodePaiement.length === 0 ? (
                                      <span className="text-muted-foreground">
                                        Sélectionner les méthodes
                                      </span>
                                    ) : (
                                      filters.methodePaiement.map(methode => {
                                        const option = methodePaiementOptions.find(
                                          opt => opt.value === methode
                                        );
                                        return (
                                          <Badge
                                            key={methode}
                                            variant="secondary"
                                            className="text-xs bg-purple-100 text-purple-800 hover:bg-purple-200"
                                          >
                                            {option?.label || methode}
                                            <X
                                              className="ml-1 h-3 w-3 cursor-pointer hover:text-purple-600"
                                              onClick={e => {
                                                e.stopPropagation();
                                                removeMethodePaiement(methode);
                                              }}
                                            />
                                          </Badge>
                                        );
                                      })
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
                                  {methodePaiementOptions.map((methode, index) => (
                                    <div
                                      key={index}
                                      className="flex items-center space-x-2"
                                    >
                                      <Checkbox
                                        id={`methodePaiement-${methode.value}`}
                                        checked={filters.methodePaiement.includes(
                                          methode.value
                                        )}
                                        onCheckedChange={checked =>
                                          handleMethodePaiementChange(
                                            methode.value,
                                            checked as boolean
                                          )
                                        }
                                      />
                                      <Label
                                        htmlFor={`methodePaiement-${methode.value}`}
                                        className="text-sm font-medium cursor-pointer"
                                      >
                                        {methode.label}
                                      </Label>
                                    </div>
                                  ))}
                                </div>
                              </PopoverContent>
                            </Popover>
                          </div>
                          <div className="grid grid-rows-2 grid-cols-4 items-center my-2">
                            <Label
                              htmlFor="compte"
                              className="text-left text-black col-span-4"
                            >
                              Compte :
                            </Label>
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  className="col-span-4 justify-between text-left font-normal focus:ring-2 focus:ring-purple-500 bg-white"
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
                                          className="text-xs bg-blue-100 text-blue-800 hover:bg-blue-200"
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
                                className="w-full p-3"
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
                                          id={`compte-${element.compte}`}
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
                                          htmlFor={`compte-${element.compte}`}
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
                              Date de règlement :
                            </Label>
                            <CustomDateRangePicker
                              startDate={startDate}
                              setStartDate={setStartDate}
                              endDate={endDate}
                              setEndDate={setEndDate}
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label
                              htmlFor="datePrelevement"
                              className="text-left text-black"
                            >
                              Date de prélèvement :
                            </Label>
                            <CustomDateRangePicker
                              startDate={startDatePrelevement}
                              setStartDate={setStartDatePrelevement}
                              endDate={endDatePrelevement}
                              setEndDate={setEndDatePrelevement}
                            />
                          </div>
                        
                          <div className="grid grid-cols-4 grid-rows-2 items-start">
                            <Label
                              htmlFor="montant"
                              className="text-left text-black col-span-4"
                            >
                              Montant :
                            </Label>
                            <div className="col-span-4">
                              {maxMontant > 0 ? (
                                <>
                                  <PriceRangeSlider
                                    min={0}
                                    max={maxMontant}
                                    step={100}
                                    value={filters.montant}
                                    onValueChange={value => {
                                      setFilters({
                                        ...filters,
                                        montant: value as [number, number],
                                      });
                                    }}
                                  />
                                  <div className="flex justify-between mt-2">
                                    <span>{filters.montant[0]} DH</span>
                                    <span>{filters.montant[1]} DH</span>
                                  </div>
                                </>
                              ) : (
                                <div className="text-sm text-gray-500 py-2">
                                  Chargement...
                                </div>
                              )}
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
                          query: debouncedQuery || undefined,
                          statut: filters.statut,
                          compte:
                            filters.compte.length > 0
                              ? filters.compte.join(",")
                              : undefined,
                          methodePaiement:
                            filters.methodePaiement.length > 0
                              ? filters.methodePaiement.join(",")
                              : undefined,
                          statusPrelevement:
                            filters.statusPrelevement.length > 0
                              ? filters.statusPrelevement.join(",")
                              : undefined,
                          from: startDate,
                          to: endDate,
                          fromPrelevement: startDatePrelevement,
                          toPrelevement: endDatePrelevement,
                          minMontant:
                            filters.montant[0] > 0
                              ? filters.montant[0]
                              : undefined,
                          maxMontant:
                            filters.montant[1] < maxMontant
                              ? filters.montant[1]
                              : undefined,
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
                  </div>
                </div>
                <div className="flex justify-end mb-4">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="rounded-full">
                        <Columns className="mr-2 h-4 w-4" />
                        Colonnes
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-56" align="end">
                      <div className="space-y-3">
                        <h4 className="font-medium text-sm text-gray-900">
                          Colonnes visibles
                        </h4>
                        <div className="space-y-2">
                          {columnDefinitions.map(column => (
                            <div
                              key={column.key}
                              className="flex items-center space-x-2"
                            >
                              <Checkbox
                                id={column.key}
                                checked={
                                  visibleColumns[
                                    column.key as keyof typeof visibleColumns
                                  ]
                                }
                                onCheckedChange={() => toggleColumn(column.key)}
                              />
                              <Label
                                htmlFor={column.key}
                                className="text-sm font-normal cursor-pointer"
                              >
                                {column.label}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="flex justify between gap-6 items-start">
                  <div className="w-full col-span-1 sm:col-span-2 md:col-span-3">
                    {/* Table */}
                    <div className="rounded-lg border overflow-x-auto mb-3">
                      <Table className="w-full">
                        <TableHeader>
                          <TableRow>
                            {visibleColumns.dateCreation && (
                              <TableHead className="w-[150px]">
                                Date de création
                              </TableHead>
                            )}
                            {visibleColumns.datePrelevement && (
                              <TableHead>Date de prélèvement</TableHead>
                            )}
                            {visibleColumns.fournisseur && (
                              <TableHead>Fournisseur</TableHead>
                            )}
                            {visibleColumns.montant && (
                              <TableHead>Montant</TableHead>
                            )}
                            {visibleColumns.methode && (
                              <TableHead>Méthode</TableHead>
                            )}
                            {visibleColumns.compte && (
                              <TableHead>Compte</TableHead>
                            )}
                            {visibleColumns.statut && (
                              <TableHead>Statut</TableHead>
                            )}
                            {visibleColumns.numero && (
                              <TableHead>Numéro</TableHead>
                            )}
                            {visibleColumns.facture && (
                              <TableHead>Facture</TableHead>
                            )}
                            {visibleColumns.motif && (
                              <TableHead>Motif</TableHead>
                            )}
                            {visibleColumns.actions && (
                              <TableHead className="text-center">
                                Actions
                              </TableHead>
                            )}
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
                          ) : hasReglements ? (
                            reglements.data?.reglements?.map(
                              (reglement: Reglement) => {
                                const reglementTable =
                                  mapReglementForTable(reglement);
                                const prelevementChip =
                                  getPrelevementChip(reglement);
                                const _prelevementDate =
                                  getPrelevementDate(reglement);
                                return (
                                  <TableRow key={reglement.id}>
                                    {visibleColumns.dateCreation && (
                                      <TableCell className="font-medium py-1">
                                        {formatDate(reglement.dateReglement) ||
                                          "—"}
                                      </TableCell>
                                    )}
                                    {visibleColumns.datePrelevement && (
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
                                    )}
                                    {visibleColumns.fournisseur && (
                                      <TableCell className="font-medium py-0">
                                        {reglement.fournisseur.nom || "—"}
                                      </TableCell>
                                    )}
                                    {visibleColumns.montant && (
                                      <TableCell className="font-medium py-0">
                                        {formatCurrency(reglementTable.montant)}
                                      </TableCell>
                                    )}
                                    {visibleColumns.methode && (
                                      <TableCell
                                        className={`font-medium py-0 ${
                                          (reglement.methodePaiement ===
                                            "cheque" ||
                                            reglement.methodePaiement ===
                                              "traite") &&
                                          "cursor-pointer hover:text-purple-600"
                                        }`}
                                        onClick={() => {
                                          if (
                                            reglement.methodePaiement ===
                                              "cheque" ||
                                            reglement.methodePaiement ===
                                              "traite"
                                          ) {
                                            setSelectedReglementForCheque(
                                              reglement
                                            );
                                            setChequeDialogOpen(true);
                                          }
                                        }}
                                      >
                                        {methodePaiementLabel(reglementTable)}
                                      </TableCell>
                                    )}
                                    {visibleColumns.compte && (
                                      <TableCell className="font-medium py-0">
                                        {reglementTable.compte}
                                      </TableCell>
                                    )}
                                    {visibleColumns.statut && (
                                      <TableCell className="font-medium py-0">
                                        {reglement.statusPrelevement ? (
                                          reglement.datePrelevement ? (
                                            <Select
                                              value={
                                                statusPrelevements[
                                                  reglement.id
                                                ] ||
                                                reglement.statusPrelevement ||
                                                "en_attente"
                                              }
                                              onValueChange={value =>
                                                handleChangeStatusPrelevement(
                                                  reglement.id,
                                                  value as
                                                    | "en_attente"
                                                    | "confirme"
                                                    | "echoue"
                                                    | "reporte"
                                                    | "refuse",
                                                  (statusPrelevements[
                                                    reglement.id
                                                  ] ||
                                                    reglement.statusPrelevement ||
                                                    "en_attente") as
                                                    | "en_attente"
                                                    | "confirme"
                                                    | "echoue"
                                                    | "reporte"
                                                    | "refuse"
                                                    | null
                                                    | undefined,
                                                  reglement.fournisseur.nom,
                                                  reglement.datePrelevement
                                                )
                                              }
                                            >
                                              <SelectTrigger className="h-8 w-[130px] text-xs border-0 bg-transparent hover:bg-gray-50">
                                                <SelectValue>
                                                  <span
                                                    className={`text-xs px-2 py-1 rounded-full ${getStatusPrelevementColor(
                                                      statusPrelevements[
                                                        reglement.id
                                                      ] ||
                                                        reglement.statusPrelevement
                                                    )}`}
                                                  >
                                                    {getStatusPrelevementLabel(
                                                      statusPrelevements[
                                                        reglement.id
                                                      ] ||
                                                        reglement.statusPrelevement
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
                                                <SelectItem value="confirme">
                                                  <span className="flex items-center gap-2">
                                                    <span className="h-2 w-2 rounded-full bg-green-500"></span>
                                                    Confirmé
                                                  </span>
                                                </SelectItem>
                                                <SelectItem value="echoue">
                                                  <span className="flex items-center gap-2">
                                                    <span className="h-2 w-2 rounded-full bg-red-500"></span>
                                                    Échoué
                                                  </span>
                                                </SelectItem>
                                                <SelectItem value="reporte">
                                                  <span className="flex items-center gap-2">
                                                    <span className="h-2 w-2 rounded-full bg-amber-500"></span>
                                                    Reporté
                                                  </span>
                                                </SelectItem>
                                                <SelectItem value="refuse">
                                                  <span className="flex items-center gap-2">
                                                    <span className="h-2 w-2 rounded-full bg-gray-500"></span>
                                                    Refusé
                                                  </span>
                                                </SelectItem>
                                              </SelectContent>
                                            </Select>
                                          ) : (
                                            // Afficher le statut en lecture seule si pas de datePrelevement
                                            <span
                                              className={`text-xs px-2 py-1 rounded-full ${getStatusPrelevementColor(
                                                statusPrelevements[
                                                  reglement.id
                                                ] || reglement.statusPrelevement
                                              )}`}
                                            >
                                              {getStatusPrelevementLabel(
                                                statusPrelevements[
                                                  reglement.id
                                                ] || reglement.statusPrelevement
                                              )}
                                            </span>
                                          )
                                        ) : (
                                          <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700">
                                            —
                                          </span>
                                        )}
                                      </TableCell>
                                    )}
                                    {visibleColumns.numero && (
                                      <TableCell className="font-medium py-0">
                                        {reglementTable.cheque?.numero || "—"}
                                      </TableCell>
                                    )}
                                    {visibleColumns.facture && (
                                      <TableCell className="font-medium py-0 text-center">
                                        {reglement.factureAchatsId ||
                                        reglement.factureAchats ? (
                                          <span className="text-green-600 font-semibold">
                                            {reglement.factureAchats?.numero ||
                                              "—"}
                                          </span>
                                        ) : (
                                          reglementTable.compte ===
                                            "compte professionnel" && (
                                            <X className="h-5 w-5 text-red-500" />
                                          )
                                        )}
                                      </TableCell>
                                    )}
                                    {visibleColumns.motif && (
                                      <TableCell className="font-medium py-0">
                                        {reglementTable.motif || "—"}
                                      </TableCell>
                                    )}
                                    {visibleColumns.actions && (
                                      <TableCell className="text-right py-2">
                                        <DropdownMenu
                                          open={openMenuId === reglement.id}
                                          onOpenChange={open => {
                                            setOpenMenuId(
                                              open ? reglement.id : null
                                            );
                                          }}
                                        >
                                          <DropdownMenuTrigger asChild>
                                            <Button
                                              variant="ghost"
                                              size="icon"
                                              className="h-8 w-8 rounded-full hover:bg-gray-200"
                                            >
                                              <MoreVertical className="h-4 w-4" />
                                              <span className="sr-only">
                                                Ouvrir le menu
                                              </span>
                                            </Button>
                                          </DropdownMenuTrigger>
                                          <DropdownMenuContent
                                            align="end"
                                            className="w-72 rounded-md"
                                          >
                                            {isAdmin && (
                                              <DropdownMenuItem
                                                onClick={() => {
                                                  setUpdateDialog(true);
                                                  setReglementForTable(
                                                    reglementTable
                                                  );
                                                  setOpenMenuId(null);
                                                }}
                                                className="flex items-center gap-2 cursor-pointer group hover:!bg-purple-100"
                                              >
                                                <Pen className="h-4 w-4 text-purple-600 group-hover:text-purple-600" />
                                                <span className="transition-colors duration-200 group-hover:text-purple-600 group-hover:bg-purple-100">
                                                  Modifier
                                                </span>
                                              </DropdownMenuItem>
                                            )}
                                            {!reglement.factureAchatsId &&
                                              !reglement.factureAchats &&
                                              reglementTable.compte?.toLowerCase() ===
                                                "compte professionnel" && (
                                              <DropdownMenuItem
                                                onClick={() => {
                                                  setReglementForFacture(
                                                    reglement
                                                  );
                                                  setFactureDialog(true);
                                                  setOpenMenuId(null);
                                                }}
                                                className="flex items-center gap-2 cursor-pointer group hover:!bg-emerald-100"
                                              >
                                                <FileText className="h-4 w-4 text-emerald-600" />
                                                <span className="transition-colors duration-200 group-hover:text-emerald-600 group-hover:bg-emerald-100">
                                                  Créer une facture
                                                </span>
                                              </DropdownMenuItem>
                                            )}
                                            {reglement.datePrelevement && (
                                              <DropdownMenuItem
                                                onClick={() => {
                                                  setSelectedReglementForPrelevement(
                                                    reglement
                                                  );
                                                  setPrelevementDialogOpen(
                                                    true
                                                  );
                                                  setOpenMenuId(null);
                                                }}
                                                className="flex items-center gap-2 cursor-pointer group hover:!bg-amber-100"
                                              >
                                                <CalendarClock className="h-4 w-4 text-amber-600" />
                                                <span className="transition-colors duration-200 group-hover:text-amber-600 group-hover:bg-amber-100">
                                                  Gérer le prélèvement
                                                </span>
                                              </DropdownMenuItem>
                                            )}
                                            
                                            {isAdmin && (
                                              <>
                                              <DropdownMenuSeparator />
                                              <DropdownMenuItem
                                                onClick={() => {
                                                  setDeleteDialog(true);
                                                  setReglementForTable(
                                                    reglementTable
                                                  );
                                                  setOpenMenuId(null);
                                                }}
                                                className="flex items-center gap-2 cursor-pointer group hover:!bg-red-100"
                                              >
                                                <Trash2 className="h-4 w-4 text-red-600" />
                                                <span className="transition-colors duration-200 group-hover:text-red-600 group-hover:bg-red-100">
                                                  Supprimer
                                                </span>
                                              </DropdownMenuItem>
                                              </>
                                              
                                            )}
                                          </DropdownMenuContent>
                                        </DropdownMenu>
                                      </TableCell>
                                    )}
                                  </TableRow>
                                );
                              }
                            )
                          ) : (
                            <TableRow>
                              <TableCell
                                colSpan={
                                  Object.values(visibleColumns).filter(Boolean)
                                    .length
                                }
                                className="text-center"
                              >
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

      <UpdateReglementDialog
        isOpen={updateDialog}
        onClose={() => {
          setUpdateDialog(false);
        }}
        reglement={reglementForTable}
      />

      <Dialog open={statutChangeDialog} onOpenChange={setStatutChangeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer le changement de statut</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir changer le statut de prélèvement du
              règlement{" "}
              {pendingStatutChange?.fournisseurNom && (
                <>
                  pour <b>{pendingStatutChange.fournisseurNom.toUpperCase()}</b>{" "}
                </>
              )}
              de <b>{pendingStatutChange?.currentStatut}</b> à{" "}
              <b>{getStatusPrelevementLabel(pendingStatutChange?.newStatut)}</b>{" "}
              ?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              className="rounded-full"
              variant="outline"
              onClick={() => {
                setStatutChangeDialog(false);
                setPendingStatutChange(null);
              }}
            >
              Annuler
            </Button>
            <Button
              className="rounded-full bg-green-500 hover:bg-green-600 text-white"
              onClick={confirmStatutChange}
            >
              Confirmer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <CreatefactureAchatsDialog
        reglement={reglementForFacture}
        open={factureDialog}
        onOpenChange={setFactureDialog}
      />
      <PrelevementConfirmationDialog
        isOpen={prelevementDialogOpen}
        onClose={() => {
          setPrelevementDialogOpen(false);
          setSelectedReglementForPrelevement(null);
        }}
        reglement={
          selectedReglementForPrelevement
            ? {
                id: selectedReglementForPrelevement.id,
                montant: selectedReglementForPrelevement.montant,
                fournisseur: {
                  nom: selectedReglementForPrelevement.fournisseur.nom,
                },
                datePrelevement:
                  selectedReglementForPrelevement.datePrelevement || null,
              }
            : null
        }
        onConfirm={() => {
          queryClient.invalidateQueries({ queryKey: ["reglements"] });
        }}
      />
      <Dialog open={chequeDialogOpen} onOpenChange={setChequeDialogOpen}>
        <DialogContent className="sm:max-w-5xl max-h-[95vh] overflow-y-auto p-0">
          {selectedReglementForCheque && (
            <div className="space-y-4 p-6">
              <DialogHeader className="text-center pb-4">
                <DialogTitle className="text-2xl font-bold">
                  {selectedReglementForCheque.methodePaiement === "cheque"
                    ? "CHÈQUE BANCAIRE"
                    : "TRAITE"}
                </DialogTitle>
              </DialogHeader>

              {/* Simulation d'un vrai chèque en format horizontal inspiré du design européen */}
              <div className="border-2 border-gray-800 bg-white p-8 shadow-2xl relative overflow-hidden min-h-[280px]">
                {/* Bordures décoratives avec points */}
                <div className="absolute top-0 left-0 right-0 h-1 border-b border-dotted border-gray-400"></div>
                <div className="absolute bottom-0 left-0 right-0 h-1 border-t border-dotted border-gray-400"></div>
                <div className="absolute left-0 top-0 bottom-0 w-1 border-r border-dotted border-gray-400"></div>
                <div className="absolute right-0 top-0 bottom-0 w-1 border-l border-dotted border-gray-400"></div>

                {/* Lignes de sécurité en arrière-plan */}
                <div
                  className="absolute inset-0 opacity-[0.02] pointer-events-none"
                  style={{
                    backgroundImage:
                      "repeating-linear-gradient(45deg, transparent, transparent 10px, #000 10px, #000 11px)",
                  }}
                ></div>

                <div className="relative z-10 h-full flex flex-col">
                  {/* En-tête - Top section */}
                  <div className="flex justify-between items-start mb-6">
                    {/* Top Left - Compte bancaire */}
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center border-2 border-gray-400">
                        <LandmarkIcon className="h-4 w-4 text-gray-600" />
                      </div>
                      <div className="text-xs text-gray-700">
                        <div className="text-[10px] text-gray-600">
                          Compte bancaire
                        </div>
                        <div className="font-bold text-sm mb-0.5 text-gray-900 uppercase">
                          {selectedReglementForCheque.compte}
                        </div>
                      </div>
                    </div>

                    {/* Top Right - Numéro et Date */}
                    <div className="text-left flex gap-4">
                      <div className="text-[10px] text-gray-600 mb-1 font-medium uppercase">
                        Date de création: <br />
                        <span className="font-bold text-sm text-gray-900">
                          {formatDate(selectedReglementForCheque.dateReglement)}
                        </span>
                      </div>
                      <div className="text-[10px] text-gray-600 mb-1 font-medium uppercase">
                        Date de prélèvement: <br />
                        <span className="font-bold text-sm text-gray-900">
                          {formatDate(
                            selectedReglementForCheque.datePrelevement
                          )}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Middle section - Bénéficiaire et Montant */}
                  <div className="flex justify-between items-start mb-6 gap-8">
                    {/* Left - Pay to the order of */}
                    <div className="flex-1">
                      <div className="text-[10px] text-gray-600 mb-1 font-medium uppercase tracking-wide">
                        PAYEZ À L&apos;ORDRE DE
                      </div>
                      <div className="text-xl font-extrabold border-b-2 border-gray-900 pb-2 uppercase tracking-wide min-h-[2.5rem] flex items-end">
                        {selectedReglementForCheque.fournisseur.nom}
                      </div>
                    </div>

                    {/* Right - Montant numérique */}
                    <div className="flex items-center gap-2">
                      <div className="border-2 border-gray-900 px-4 py-2 min-w-[150px]">
                        <div className="text-2xl font-extrabold text-gray-900 text-right">
                          {selectedReglementForCheque.montant.toFixed(2)} DH
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Montant en lettres */}
                  <div className="mb-6">
                    <div className="text-base font-bold border-b-2 border-gray-900 pb-2 min-h-[2rem] flex items-end tracking-wide">
                      {nombreEnLettres(selectedReglementForCheque.montant)}{" "}
                      <span className="ml-2">dirhams</span>
                    </div>
                  </div>

                  {/* Bottom section */}
                  <div className="flex justify-between items-end mt-auto pt-4">
                    {/* Bottom Left - FOR/Motif */}
                    <div className="flex-1">
                      <div className="text-[10px] text-gray-600 mb-1 font-medium uppercase">
                        Motif :
                      </div>
                      <div className="text-sm font-semibold pb-1 text-gray-800 min-h-[1.5rem]">
                        {selectedReglementForCheque.motif || "—"}
                      </div>
                    </div>
                  </div>

                  {/* Ligne MICR en bas */}
                  <div className="mt-4 pt-3 border-t border-dashed border-gray-400">
                    <div className="text-[30px] text-gray-600 font-mono tracking-widest text-center">
                      ⑆ {selectedReglementForCheque.cheque?.numero} ⑆
                    </div>
                  </div>
                </div>
              </div>

              <DialogFooter className="pt-4">
                <Button
                  className="rounded-full"
                  variant="outline"
                  onClick={() => {
                    setChequeDialogOpen(false);
                    setSelectedReglementForCheque(null);
                  }}
                >
                  Fermer
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
      <Dialog
        open={balanceDialogOpen}
        onOpenChange={(open) => {
          setBalanceDialogOpen(open);
          if (!open) {
            setBalanceStep("period");
            setBalanceStartDate(undefined);
            setBalanceEndDate(undefined);
          }
        }}
      >
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Balance du compte professionnel</DialogTitle>
            <DialogDescription>
              {balanceStep === "period"
                ? "Sélectionnez une période pour calculer la balance"
                : "Résultats de la balance pour la période sélectionnée"}
            </DialogDescription>
          </DialogHeader>

          {balanceStep === "period" ? (
            <div className="space-y-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="balanceDate" className="text-left text-black">
                  Période de prélèvement :
                </Label>
                <CustomDateRangePicker
                  startDate={balanceStartDate}
                  setStartDate={setBalanceStartDate}
                  endDate={balanceEndDate}
                  setEndDate={setBalanceEndDate}
                />
              </div>
            </div>
          ) : (
            <div className="space-y-4 py-4">
              {balanceQuery.isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <LoadingDots />
                </div>
              ) : balanceQuery.data ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-lg border bg-gray-50">
                      <div className="text-sm text-gray-600 mb-1">
                        Solde du compte professionnel
                      </div>
                      <div className="text-2xl font-bold text-gray-900">
                        {formatCurrency(balanceQuery.data.solde)}
                      </div>
                    </div>
                    <div className="p-4 rounded-lg border bg-gray-50">
                      <div className="text-sm text-gray-600 mb-1">
                        Somme des règlements prévus
                      </div>
                      <div className="text-2xl font-bold text-red-600">
                        {formatCurrency(balanceQuery.data.sommeReglements)}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {balanceQuery.data.nombreReglements} règlement
                        {balanceQuery.data.nombreReglements > 1 ? "s" : ""}
                      </div>
                    </div>
                  </div>
                  <div
                    className={`p-4 rounded-lg border ${
                      balanceQuery.data.difference >= 0
                        ? "bg-green-50 border-green-200"
                        : "bg-red-50 border-red-200"
                    }`}
                  >
                    <div className="text-sm text-gray-600 mb-1">
                      Solde restant après prélèvements
                    </div>
                    <div
                      className={`text-3xl font-bold ${
                        balanceQuery.data.difference >= 0
                          ? "text-green-700"
                          : "text-red-700"
                      }`}
                    >
                      {formatCurrency(balanceQuery.data.difference)}
                    </div>
                    {balanceQuery.data.difference < 0 && (
                      <div className="text-sm text-red-600 mt-2 font-medium">
                        ⚠️ Le solde ne peut pas supporter les règlements prévus
                      </div>
                    )}
                    {balanceQuery.data.difference >= 0 && (
                      <div className="text-sm text-green-600 mt-2 font-medium">
                        ✓ Le solde peut supporter les règlements prévus
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  Aucune donnée disponible
                </div>
              )}
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            {balanceStep === "period" ? (
              <>
                <Button
                  className="rounded-full"
                  variant="outline"
                  onClick={() => {
                    setBalanceDialogOpen(false);
                    setBalanceStartDate(undefined);
                    setBalanceEndDate(undefined);
                  }}
                >
                  Annuler
                </Button>
                <Button
                  className="rounded-full bg-purple-500 hover:bg-purple-600 text-white"
                  onClick={() => {
                    if (balanceStartDate && balanceEndDate) {
                      setBalanceStep("results");
                    } else {
                      toast.error("Veuillez sélectionner une période");
                    }
                  }}
                  disabled={!balanceStartDate || !balanceEndDate}
                >
                  Suivant
                </Button>
              </>
            ) : (
              <>
                <Button
                  className="rounded-full"
                  variant="outline"
                  onClick={() => {
                    setBalanceStep("period");
                    setBalanceStartDate(undefined);
                    setBalanceEndDate(undefined);
                  }}
                >
                  Retour
                </Button>
                <Button
                  className="rounded-full"
                  variant="outline"
                  onClick={() => {
                    setBalanceDialogOpen(false);
                    setBalanceStep("period");
                    setBalanceStartDate(undefined);
                    setBalanceEndDate(undefined);
                  }}
                >
                  Fermer
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Dialog Versement vers compte pro */}
      <Dialog
        open={versementDialogOpen}
        onOpenChange={(open) => {
          setVersementDialogOpen(open);
          if (!open) {
            setVersementMontant("");
            setVersementSourceCompteId("");
            setVersementReference("");
            setVersementNote("");
            setVersementHistoryPage(1);
          }
        }}
      >
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">
              Versement vers compte professionnel
            </DialogTitle>
            <DialogDescription>
              Effectuer un versement depuis un compte vers le compte professionnel
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Formulaire de versement */}
            <div className="space-y-4 border-b pb-4">
              <h3 className="text-lg font-semibold">Nouveau versement</h3>
              
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="versement-montant" className="text-left text-black">
                    Montant (DH) *
                  </Label>
                  <Input
                    id="versement-montant"
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="0.00"
                    value={versementMontant}
                    onChange={(e) => setVersementMontant(e.target.value)}
                    className="bg-white"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="versement-source" className="text-left text-black">
                    Compte source *
                  </Label>
                  <Select
                    value={versementSourceCompteId}
                    onValueChange={setVersementSourceCompteId}
                  >
                    <SelectTrigger className="bg-white">
                      <SelectValue placeholder="Sélectionner un compte" />
                    </SelectTrigger>
                    <SelectContent>
                      {comptes.data
                        ?.filter(
                          (c: { id: string; compte: string }) =>
                            c.compte.toLowerCase() !== "compte professionnel"
                        )
                        .map((compte: { id: string; compte: string; solde: number }) => (
                          <SelectItem key={compte.id} value={compte.id}>
                            <div className="flex items-center justify-between w-full">
                              <span>{compte.compte}</span>
                              <span className="ml-4 text-sm text-gray-500">
                                {formatCurrency(compte.solde)}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="versement-reference" className="text-left text-black">
                    Référence (optionnel)
                  </Label>
                  <Input
                    id="versement-reference"
                    placeholder="Référence du versement"
                    value={versementReference}
                    onChange={(e) => setVersementReference(e.target.value)}
                    className="bg-white"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="versement-note" className="text-left text-black">
                    Note (optionnel)
                  </Label>
                  <Input
                    id="versement-note"
                    placeholder="Note ou description"
                    value={versementNote}
                    onChange={(e) => setVersementNote(e.target.value)}
                    className="bg-white"
                  />
                </div>
              </div>

              <Button
                className="rounded-full bg-green-600 hover:bg-green-700 text-white w-full"
                onClick={() => {
                  const montant = parseFloat(versementMontant);
                  if (!montant || montant <= 0) {
                    toast.error("Veuillez saisir un montant valide");
                    return;
                  }
                  if (!versementSourceCompteId) {
                    toast.error("Veuillez sélectionner un compte source");
                    return;
                  }
                  if (!compteProQuery.data?.id) {
                    toast.error("Compte professionnel introuvable");
                    return;
                  }

                  // Vérifier le solde
                  const sourceCompte = comptes.data?.find(
                    (c: { id: string }) => c.id === versementSourceCompteId
                  );
                  if (sourceCompte && sourceCompte.solde < montant) {
                    toast.error(
                      `Solde insuffisant. Solde disponible: ${formatCurrency(sourceCompte.solde)}`
                    );
                    return;
                  }

                  createVersementMutation.mutate({
                    montant,
                    sourceCompteId: versementSourceCompteId,
                    compteProId: compteProQuery.data.id,
                    reference: versementReference || undefined,
                    note: versementNote || undefined,
                  });
                }}
                disabled={
                  createVersementMutation.isLoading ||
                  !versementMontant ||
                  !versementSourceCompteId ||
                  !compteProQuery.data
                }
              >
                {createVersementMutation.isLoading ? (
                  <>
                    <LoadingDots />
                    <span className="ml-2">Traitement...</span>
                  </>
                ) : (
                  "Valider le versement"
                )}
              </Button>
            </div>

            {/* Historique des versements */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <History className="h-5 w-5" />
                  Historique des versements
                </h3>
              </div>

              {versementsHistoryQuery.isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <LoadingDots />
                </div>
              ) : versementsHistoryQuery.data?.versements?.length > 0 ? (
                <>
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Montant</TableHead>
                          <TableHead>Compte source</TableHead>
                          <TableHead>Compte pro</TableHead>
                          <TableHead>Référence</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {versementsHistoryQuery.data.versements.map(
                          (versement: {
                            id: string;
                            date: string;
                            montant: number;
                            sourceCompte: { compte: string };
                            comptePro: { compte: string };
                            reference: string | null;
                          }) => (
                            <TableRow key={versement.id}>
                              <TableCell>
                                {formatDate(versement.date)}
                              </TableCell>
                              <TableCell className="font-semibold">
                                {formatCurrency(versement.montant)}
                              </TableCell>
                              <TableCell>{versement.sourceCompte.compte}</TableCell>
                              <TableCell>{versement.comptePro.compte}</TableCell>
                              <TableCell>
                                {versement.reference || "—"}
                              </TableCell>
                            </TableRow>
                          )
                        )}
                      </TableBody>
                    </Table>
                  </div>

                  {versementsHistoryQuery.data.pagination.totalPages > 1 && (
                    <div className="flex justify-center">
                      <CustomPagination
                        currentPage={versementHistoryPage}
                        totalPages={versementsHistoryQuery.data.pagination.totalPages}
                        setCurrentPage={setVersementHistoryPage}
                      />
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-8 text-gray-500 border rounded-lg">
                  Aucun versement enregistré
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              className="rounded-full"
              variant="outline"
              onClick={() => {
                setVersementDialogOpen(false);
                setVersementMontant("");
                setVersementSourceCompteId("");
                setVersementReference("");
                setVersementNote("");
                setVersementHistoryPage(1);
              }}
            >
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default function Banques() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <LoadingDots />
            <p className="mt-4 text-muted-foreground">Chargement...</p>
          </div>
        </div>
      }
    >
      <ReglementContent />
    </Suspense>
  );
}
