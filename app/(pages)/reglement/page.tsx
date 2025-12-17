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
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import {
  CalendarClock,
  Columns,
  FileText,
  Filter,
  MoreVertical,
  Pen,
  Printer,
  Search,
  Trash2,
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
  if (!reglement.datePrelevement) return null;

  const statusPrelevement = reglement.statusPrelevement || "en_attente";
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

  // Si le statut est "reporte", afficher le compte à rebours avec un style différent
  if (statusPrelevement === "reporte") {
    if (diffDays > 0) {
      return {
        label: `Reporté - J-${diffDays}`,
        className: "bg-amber-100 text-amber-700",
      };
    }
    if (diffDays === 0) {
      return {
        label: "Reporté - Aujourd'hui",
        className: "bg-amber-100 text-amber-700",
      };
    }
    // Date passée pour un reporté
    const joursRetard = Math.abs(diffDays);
    return {
      label: `Reporté - ${joursRetard} jour${
        joursRetard > 1 ? "s" : ""
      } de retard`,
      className: "bg-red-100 text-red-700",
    };
  }

  // Pour les autres statuts (confirme, echoue, refuse), afficher juste le statut
  if (statusPrelevement !== "en_attente") {
    const statusLabels: Record<string, { label: string; className: string }> = {
      confirme: { label: "Confirmé", className: "bg-green-100 text-green-700" },
      echoue: { label: "Échoué", className: "bg-red-100 text-red-700" },
      refuse: { label: "Refusé", className: "bg-gray-100 text-gray-700" },
    };
    return statusLabels[statusPrelevement] || null;
  }

  // Pour "en_attente", afficher le compte à rebours normal
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

  // En retard (date passée et toujours en_attente)
  const joursRetard = Math.abs(diffDays);
  return {
    label: `${joursRetard} jour${joursRetard > 1 ? "s" : ""} de retard`,
    className: "bg-red-100 text-red-700",
  };
};
function ReglementContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
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
    compte: "all",
    statut: "all",
    methodePaiement: "all",
    statusPrelevement: "all",
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
            filters.methodePaiement === "all"
              ? undefined
              : filters.methodePaiement,
          compte: filters.compte === "all" ? undefined : filters.compte,
          statusPrelevement:
            filters.statusPrelevement === "all"
              ? undefined
              : filters.statusPrelevement,
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
  }, [maxMontant]);

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
  }, [searchParams, reglements.data, router]);

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
    fournisseurNom?: string
  ) => {
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

  const formatNumeroReglement = (numero?: string) => {
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
                                <SelectItem value="espece">Espèce</SelectItem>
                                <SelectItem value="versement">
                                  Versement
                                </SelectItem>
                                <SelectItem value="cheque">Chèque</SelectItem>
                                <SelectItem value="traite">Traite</SelectItem>
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
                          <div className="grid items-center gap-3 my-2">
                            <Label
                              htmlFor="statusPrelevement"
                              className="text-left text-black"
                            >
                              Statut de prélèvement :
                            </Label>
                            <Select
                              value={filters.statusPrelevement}
                              name="statusPrelevement"
                              onValueChange={value =>
                                setFilters({
                                  ...filters,
                                  statusPrelevement: value,
                                })
                              }
                            >
                              <SelectTrigger className="col-span-3 bg-white focus:ring-purple-500">
                                <SelectValue placeholder="Sélectionner un statut" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">
                                  Tous les statuts
                                </SelectItem>
                                <SelectItem value="en_attente">
                                  <div className="flex items-center gap-2">
                                    <span className="h-2 w-2 shadow-md rounded-full bg-amber-500" />
                                    En attente
                                  </div>
                                </SelectItem>
                                <SelectItem value="confirme">
                                  <div className="flex items-center gap-2">
                                    <span className="h-2 w-2 rounded-full bg-green-500" />
                                    Confirmé
                                  </div>
                                </SelectItem>
                                <SelectItem value="refuse">
                                  <div className="flex items-center gap-2">
                                    <span className="h-2 w-2 rounded-full bg-gray-500" />
                                    Refusé
                                  </div>
                                </SelectItem>
                                <SelectItem value="reporte">
                                  <div className="flex items-center gap-2">
                                    <span className="h-2 w-2 rounded-full bg-amber-500" />
                                    Reporté
                                  </div>
                                </SelectItem>
                                <SelectItem value="en_retard">
                                  <div className="flex items-center gap-2">
                                    <span className="h-2 w-2 rounded-full bg-red-500" />
                                    En retard
                                  </div>
                                </SelectItem>
                              </SelectContent>
                            </Select>
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
                          compte: filters.compte,
                          methodePaiement: filters.methodePaiement,
                          statusPrelevement: filters.statusPrelevement,
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
                                const prelevementDate =
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
                                                reglement.fournisseur.nom
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
                        <span className="text-xs font-bold">🏦</span>
                      </div>
                      <div className="text-xs text-gray-700">
                        <div className="font-bold text-sm mb-0.5 text-gray-900 uppercase">
                          {selectedReglementForCheque.compte}
                        </div>
                        <div className="text-[10px] text-gray-600">
                          Compte bancaire
                        </div>
                      </div>
                    </div>

                    {/* Top Right - Numéro et Date */}
                    <div className="text-right">
                      <div className="text-lg font-bold text-gray-900 mb-2">
                        {selectedReglementForCheque.cheque?.numero || "—"}
                      </div>
                      <div className="text-[10px] text-gray-600 mb-1 font-medium uppercase">
                        DATE
                      </div>
                      <div className="text-base font-bold border-b-2 border-gray-900 pb-1 min-w-[120px]">
                        {selectedReglementForCheque.cheque?.dateReglement
                          ? formatDate(
                              selectedReglementForCheque.cheque.dateReglement
                            )
                          : formatDate(
                              selectedReglementForCheque.dateReglement
                            ) || formatDate(new Date().toISOString())}
                      </div>
                    </div>
                  </div>

                  {/* Middle section - Bénéficiaire et Montant */}
                  <div className="flex justify-between items-start mb-6 gap-8">
                    {/* Left - Pay to the order of */}
                    <div className="flex-1">
                      <div className="text-[10px] text-gray-600 mb-1 font-medium uppercase tracking-wide">
                        PAYEZ À L'ORDRE DE
                      </div>
                      <div className="text-xl font-extrabold border-b-2 border-gray-900 pb-2 uppercase tracking-wide min-h-[2.5rem] flex items-end">
                        {selectedReglementForCheque.fournisseur.nom}
                      </div>
                    </div>

                    {/* Right - Montant numérique */}
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold text-gray-900">
                        DH
                      </span>
                      <div className="border-2 border-gray-900 px-4 py-2 min-w-[150px]">
                        <div className="text-2xl font-extrabold text-gray-900 text-right">
                          {selectedReglementForCheque.montant.toFixed(2)}
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
                        POUR
                      </div>
                      <div className="text-sm font-semibold border-b border-gray-400 pb-1 text-gray-800 min-h-[1.5rem]">
                        {selectedReglementForCheque.motif || "—"}
                      </div>
                    </div>

                    {/* Bottom Right - Devise avec icône */}
                    <div className="flex items-center gap-2">
                      <div className="text-sm font-bold text-gray-900 uppercase">
                        DIRHAMS
                      </div>
                      <div className="w-4 h-4 flex items-center justify-center">
                        <span className="text-xs">🔒</span>
                      </div>
                    </div>
                  </div>

                  {/* Ligne MICR en bas */}
                  <div className="mt-4 pt-3 border-t border-dashed border-gray-400">
                    <div className="text-[11px] text-gray-600 font-mono tracking-widest text-center">
                      ⑆{" "}
                      {selectedReglementForCheque.cheque?.numero || "000000000"}{" "}
                      ⑆{" "}
                      {selectedReglementForCheque.cheque?.numero?.slice(-6) ||
                        "467890"}{" "}
                      - {selectedReglementForCheque.cheque?.numero || "5890"} ⑆
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
