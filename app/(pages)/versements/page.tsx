"use client";

import CreateFactureFromMultipleVersementsDialog from "@/components/create-facture-from-multiple-versements-dialog";
import CreateFactureFromVersementDialog from "@/components/create-facture-from-versement-dialog";
import CustomDateRangePicker from "@/components/customUi/customDateRangePicker";
import CustomPagination from "@/components/customUi/customPagination";
import { PriceRangeSlider } from "@/components/customUi/customSlider";
import { DeleteConfirmationDialog } from "@/components/delete-confirmation-dialog";
import { LoadingDots } from "@/components/loading-dots";
import { Navbar } from "@/components/navbar";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  formatCurrency,
  formatDate,
} from "@/lib/functions";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import {
  ArrowUp,
  ChevronDown,
  FileText,
  Filter,
  MoreVertical,
  Pen,
  Search,
  Trash2,
  Wallet,
  X,
} from "lucide-react";
import { Suspense, useEffect, useState } from "react";
import toast, { Toaster } from "react-hot-toast";

type Versement = {
  id: string;
  montant: number;
  date: string;
  reference: string | null;
  note: string | null;
  createdAt: string;
  sourceCompte: {
    id: string;
    compte: string;
    solde: number;
  } | null;
  comptePro: {
    id: string;
    compte: string;
    solde: number;
  };
  affectationsVersement: {
    id: string;
    montant: number;
    factureId: string;
    facture: {
      id: string;
      numero: string | null;
      date: string | null;
      total: number | null;
      client: {
        id: string;
        nom: string;
      };
    };
  }[];
};

const PAGE_SIZE = 10;
const NO_SOURCE_VALUE = "__none__"; // valeur sentinelle pour "Aucun compte source" (Select n'accepte pas value="")

function VersementsContent() {
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [versementDialogOpen, setVersementDialogOpen] = useState(false);
  const [versementMontant, setVersementMontant] = useState<string>("");
  const [versementSourceCompteId, setVersementSourceCompteId] = useState<string>("");
  const [versementReference, setVersementReference] = useState<string>("");
  const [versementNote, setVersementNote] = useState<string>("");
  const [editVersementDialogOpen, setEditVersementDialogOpen] = useState(false);
  const [selectedVersement, setSelectedVersement] = useState<Versement | null>(null);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [factureDialogOpen, setFactureDialogOpen] = useState(false);
  const [versementForFacture, setVersementForFacture] = useState<Versement | null>(null);
  const [multipleVersementsDialogOpen, setMultipleVersementsDialogOpen] = useState(false);
  const [expandedVersementId, setExpandedVersementId] = useState<string | null>(null);
  const [editVersementMontant, setEditVersementMontant] = useState<string>("");
  const [editVersementSourceCompteId, setEditVersementSourceCompteId] = useState<string>("");
  const [editVersementReference, setEditVersementReference] = useState<string>("");
  const [editVersementNote, setEditVersementNote] = useState<string>("");
  const [filters, setFilters] = useState({
    compteSource: [] as string[],
    statut: "all" as "all" | "complet" | "en_partie" | "sans_facture",
    dateDebut: undefined as Date | undefined,
    dateFin: undefined as Date | undefined,
    montant: [0, 0] as [number, number],
  });
  const [maxMontant, setMaxMontant] = useState<number>(0);
  const queryClient = useQueryClient();

  // Debounce input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery);
      setPage(1);
    }, 500);

    return () => {
      clearTimeout(handler);
    };
  }, [searchQuery]);

  // Initialiser les champs du formulaire "Modifier" quand le dialog s'ouvre avec un versement sélectionné
  // (onOpenChange(true) n'est pas toujours appelé par Radix quand on ouvre programmatiquement)
  useEffect(() => {
    if (editVersementDialogOpen && selectedVersement) {
      setEditVersementMontant(selectedVersement.montant.toString());
      setEditVersementSourceCompteId(selectedVersement.sourceCompte?.id ?? NO_SOURCE_VALUE);
      setEditVersementReference(selectedVersement.reference ?? "");
      setEditVersementNote(selectedVersement.note ?? "");
    }
  }, [editVersementDialogOpen, selectedVersement]);

  // Query pour récupérer le compte professionnel et son solde
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

  // Query pour récupérer les comptes
  const comptes = useQuery({
    queryKey: ["comptes"],
    queryFn: async () => {
      const response = await axios.get("/api/comptesBancaires");
      return response.data.comptes;
    },
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
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.error || "Erreur lors du versement"
      );
    },
  });

  // Mutation pour mettre à jour un versement
  const updateVersementMutation = useMutation({
    mutationFn: async (data: {
      id: string;
      montant: number;
      sourceCompteId?: string;
      reference?: string;
      note?: string;
    }) => {
      const response = await axios.put(`/api/versements/${data.id}`, {
        montant: data.montant,
        sourceCompteId: data.sourceCompteId,
        reference: data.reference,
        note: data.note,
      });
      return response.data;
    },
    onSuccess: () => {
      toast.success("Versement modifié avec succès");
      setEditVersementDialogOpen(false);
      setSelectedVersement(null);
      queryClient.invalidateQueries({ queryKey: ["versements"] });
      queryClient.invalidateQueries({ queryKey: ["comptes"] });
      queryClient.invalidateQueries({ queryKey: ["comptePro"] });
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.error || "Erreur lors de la modification"
      );
    },
  });

  // Mutation pour supprimer un versement
  const deleteVersementMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await axios.delete(`/api/versements/${id}`);
      return response.data;
    },
    onSuccess: () => {
      toast.success("Versement supprimé avec succès");
      setDeleteDialog(false);
      queryClient.invalidateQueries({ queryKey: ["versements"] });
      queryClient.invalidateQueries({ queryKey: ["comptes"] });
      queryClient.invalidateQueries({ queryKey: ["comptePro"] });
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.error || "Erreur lors de la suppression"
      );
    },
  });

  // Query pour récupérer les versements
  const versementsQuery = useQuery({
    queryKey: ["versements", page, debouncedQuery],
    queryFn: async () => {
      const response = await axios.get("/api/versements", {
        params: {
          page,
          limit: PAGE_SIZE,
        },
      });
      return response.data;
    },
  });

  // Fonctions pour gérer les filtres
  const handleCompteSourceChange = (compte: string, checked: boolean) => {
    setFilters(prev => ({
      ...prev,
      compteSource: checked
        ? [...prev.compteSource, compte]
        : prev.compteSource.filter(c => c !== compte),
    }));
  };

  const removeCompteSource = (compte: string) => {
    setFilters(prev => ({
      ...prev,
      compteSource: prev.compteSource.filter(c => c !== compte),
    }));
  };

  // Calculer le statut d'un versement
  const getVersementStatut = (versement: Versement): "complet" | "en_partie" | "sans_facture" => {
    const montantLie = versement.affectationsVersement?.reduce(
      (sum, aff) => sum + aff.montant,
      0
    ) || 0;
    if (montantLie >= versement.montant) return "complet";
    if (montantLie > 0) return "en_partie";
    return "sans_facture";
  };

  // Filtrer les versements par recherche et filtres
  const filteredVersements = versementsQuery.data?.versements?.filter(
    (versement: Versement) => {
      // Filtre de recherche
      if (debouncedQuery) {
        const query = debouncedQuery.toLowerCase();
        const matchesSearch =
          versement.reference?.toLowerCase().includes(query) ||
          versement.note?.toLowerCase().includes(query) ||
          versement.sourceCompte?.compte.toLowerCase().includes(query) ||
          versement.montant.toString().includes(query);
        if (!matchesSearch) return false;
      }

      // Filtre par compte source
      if (filters.compteSource.length > 0) {
        if (!versement.sourceCompte || !filters.compteSource.includes(versement.sourceCompte.compte)) {
          return false;
        }
      }

      // Filtre par statut
      if (filters.statut !== "all") {
        const versementStatut = getVersementStatut(versement);
        if (versementStatut !== filters.statut) {
          return false;
        }
      }

      // Filtre par date
      if (filters.dateDebut || filters.dateFin) {
        const versementDate = new Date(versement.date);
        if (filters.dateDebut) {
          const startDate = new Date(filters.dateDebut);
          startDate.setHours(0, 0, 0, 0);
          if (versementDate < startDate) return false;
        }
        if (filters.dateFin) {
          const endDate = new Date(filters.dateFin);
          endDate.setHours(23, 59, 59, 999);
          if (versementDate > endDate) return false;
        }
      }

      // Filtre par montant
      if (filters.montant[0] > 0 || filters.montant[1] < maxMontant) {
        if (versement.montant < filters.montant[0] || versement.montant > filters.montant[1]) {
          return false;
        }
      }

      return true;
    }
  ) || [];

  // Calculer le total des versements
  const totalVersements = versementsQuery.data?.versements?.reduce(
    (sum: number, v: Versement) => sum + v.montant,
    0
  ) || 0;

  // Calculer le montant total non lié à une facture
  const montantTotalNonLie = versementsQuery.data?.versements?.reduce(
    (sum: number, v: Versement) => {
      const montantLie = v.affectationsVersement?.reduce(
        (affSum: number, aff) => affSum + aff.montant,
        0
      ) || 0;
      const montantNonLie = v.montant - montantLie;
      return sum + (montantNonLie > 0 ? montantNonLie : 0);
    },
    0
  ) || 0;

  // Calculer le montant maximum pour le filtre
  useEffect(() => {
    if (versementsQuery.data?.versements && versementsQuery.data.versements.length > 0) {
      const max = Math.max(
        ...versementsQuery.data.versements.map((v: Versement) => v.montant)
      );
      if (max > maxMontant) {
        setMaxMontant(Math.ceil(max / 100) * 100); // Arrondir à la centaine supérieure
      }
    }
  }, [versementsQuery.data?.versements, maxMontant]);

  // Initialiser le filtre de montant quand maxMontant est disponible
  useEffect(() => {
    if (maxMontant > 0 && filters.montant[1] === 0) {
      setFilters(prev => ({ ...prev, montant: [0, maxMontant] }));
    }
  }, [maxMontant, filters.montant]);

  return (
    <>
      <Toaster position="top-center" />
      <div className="flex flex-col h-screen">
        {/* Navbar */}
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
                {/* Header */}
                <div>
                  <h1 className="text-3xl font-bold">Versements vers compte professionnel</h1>
                  <p className="text-gray-600 mt-1">
                    Historique des versements effectués vers le compte professionnel
                  </p>
                </div>

                {/* Cartes du solde et montant non lié */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Carte du solde du compte pro */}
                  {compteProQuery.data && (
                    <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-6 text-white shadow-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-green-100 text-sm font-medium mb-1">
                            Solde actuel du compte professionnel
                          </p>
                          <p className="text-3xl font-bold">
                            {formatCurrency(compteProQuery.data.solde)}
                          </p>
                        </div>
                        <div className="bg-white/20 rounded-full p-4">
                          <Wallet className="h-8 w-8" />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Carte du montant total non lié */}
                  <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg p-6 text-white shadow-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-orange-100 text-sm font-medium mb-1">
                          Le montant à couvrir par des factures
                        </p>
                        <p className="text-3xl font-bold">
                          {formatCurrency(montantTotalNonLie)}
                        </p>                  
                      </div>
                      <div className="bg-white/20 rounded-full p-4">
                        <FileText className="h-8 w-8" />
                      </div>
                    </div>
                  </div>
                </div>
                {/* Recherche et bouton versement */}
                <div className="flex justify-between items-center gap-4">
                  {/* Recherche */}
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Rechercher par référence, note, compte source ou montant..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 rounded-full bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                    <div className="absolute right-6 top-1/3 h-4 w-4 -translate-y-1/2 text-muted-foreground">
                      {versementsQuery.isFetching && !versementsQuery.isLoading && (
                        <LoadingDots />
                      )}
                    </div>
                  </div>

                  {/* Boutons d'action */}
                  <div className="flex items-center gap-2">
                    {/* Bouton Filtres */}
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
                            Ajustez les filtres pour affiner votre recherche de versements.
                          </SheetDescription>
                        </SheetHeader>
                        <div className="grid gap-4 py-4">
                          {/* Filtre par compte source */}
                          <div className="grid grid-rows-2 grid-cols-4 items-center my-2">
                            <Label
                              htmlFor="compteSource"
                              className="text-left text-black col-span-4"
                            >
                              Compte source :
                            </Label>
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  className="col-span-4 justify-between text-left font-normal focus:ring-2 focus:ring-purple-500 bg-white"
                                >
                                  <div className="flex flex-wrap gap-1">
                                    {filters.compteSource.length === 0 ? (
                                      <span className="text-muted-foreground">
                                        Sélectionner les comptes
                                      </span>
                                    ) : (
                                      filters.compteSource.map(compte => (
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
                                              removeCompteSource(compte);
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
                                  {comptes.data
                                    ?.filter(
                                      (c: { compte: string }) =>
                                        c.compte.toLowerCase() !== "compte professionnel"
                                    )
                                    .map((compte: { id: string; compte: string }, index: number) => (
                                      <div
                                        key={index}
                                        className="flex items-center space-x-2"
                                      >
                                        <Checkbox
                                          id={`compteSource-${compte.compte}`}
                                          checked={filters.compteSource.includes(
                                            compte.compte
                                          )}
                                          onCheckedChange={checked =>
                                            handleCompteSourceChange(
                                              compte.compte,
                                              checked as boolean
                                            )
                                          }
                                        />
                                        <Label
                                          htmlFor={`compteSource-${compte.compte}`}
                                          className="text-sm font-medium cursor-pointer"
                                        >
                                          {compte.compte}
                                        </Label>
                                      </div>
                                    ))}
                                </div>
                              </PopoverContent>
                            </Popover>
                          </div>

                          {/* Filtre par statut */}
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
                                setFilters({ ...filters, statut: value as typeof filters.statut })
                              }
                            >
                              <SelectTrigger className="col-span-3 bg-white focus:ring-purple-500">
                                <SelectValue placeholder="Sélectionner un statut" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">
                                  Tous les statuts
                                </SelectItem>
                                <SelectItem value="complet">
                                  <div className="flex items-center gap-2">
                                    <span className="h-2 w-2 rounded-full bg-green-500" />
                                    Complet
                                  </div>
                                </SelectItem>
                                <SelectItem value="en_partie">
                                  <div className="flex items-center gap-2">
                                    <span className="h-2 w-2 rounded-full bg-orange-500" />
                                    En partie
                                  </div>
                                </SelectItem>
                                <SelectItem value="sans_facture">
                                  <div className="flex items-center gap-2">
                                    <span className="h-2 w-2 rounded-full bg-gray-500" />
                                    Sans facture
                                  </div>
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Filtre par date */}
                          <div className="grid gap-2">
                            <Label
                              htmlFor="date"
                              className="text-left text-black"
                            >
                              Date de versement :
                            </Label>
                            <CustomDateRangePicker
                              startDate={filters.dateDebut}
                              setStartDate={(date: Date | undefined) => setFilters({ ...filters, dateDebut: date })}
                              endDate={filters.dateFin}
                              setEndDate={(date: Date | undefined) => setFilters({ ...filters, dateFin: date })}
                            />
                          </div>

                          {/* Filtre par montant */}
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
                        </div>
                      </SheetContent>
                    </Sheet>

                    {/* Bouton Versement vers compte pro */}
                    <Button
                      variant="outline"
                      onClick={() => {
                        setVersementDialogOpen(true);
                      }}
                      className="border-green-500 bg-green-100 text-green-700 hover:bg-green-200 hover:text-green-900 rounded-full whitespace-nowrap"
                    >
                      <ArrowUp className="mr-2 h-4 w-4" />
                      Versement vers compte pro
                    </Button>

                    {/* Bouton Créer facture avec plusieurs versements */}
                    <Button
                      variant="outline"
                      onClick={() => {
                        setMultipleVersementsDialogOpen(true);
                      }}
                      className="border-blue-500 bg-blue-100 text-blue-700 hover:bg-blue-200 hover:text-blue-900 rounded-full whitespace-nowrap"
                    >
                      <FileText className="mr-2 h-4 w-4" />
                      Facture multi-versements
                    </Button>
                  </div>
                </div>

                {/* Tableau des versements */}
                <div className="bg-white border rounded-lg overflow-hidden">
                  {versementsQuery.isLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <LoadingDots />
                    </div>
                  ) : filteredVersements.length > 0 ? (
                    <>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-12"></TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Montant</TableHead>
                            <TableHead>Montant lié</TableHead>
                            <TableHead>Statut</TableHead>
                            <TableHead>Compte source</TableHead>
                            <TableHead>Référence</TableHead>
                            <TableHead>Note</TableHead>
                            <TableHead className="text-center">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredVersements.map((versement: Versement) => {
                            const isExpanded = expandedVersementId === versement.id;
                            const hasAffectations = versement.affectationsVersement && versement.affectationsVersement.length > 0;
                            return (
                              <>
                                <TableRow key={versement.id}>
                                  <TableCell>
                                    {hasAffectations && (
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6"
                                        onClick={() => {
                                          setExpandedVersementId(isExpanded ? null : versement.id);
                                        }}
                                      >
                                        <ChevronDown
                                          className={`h-4 w-4 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                                        />
                                      </Button>
                                    )}
                                  </TableCell>
                              <TableCell>
                                <div className="flex flex-col">
                                  <span className="font-medium">
                                    {formatDate(versement.date)}
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    {formatDate(versement.createdAt)}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <ArrowUp className="h-4 w-4 text-green-600" />
                                  <span className="font-semibold text-green-700">
                                    {formatCurrency(versement.montant)}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell>
                                {(() => {
                                  const montantLie = versement.affectationsVersement?.reduce(
                                    (sum, aff) => sum + aff.montant,
                                    0
                                  ) || 0;
                                  const estEntierementLie = montantLie >= versement.montant;
                                  return (
                                    <div className="flex items-center gap-2">
                                      <span
                                        className={`font-semibold ${
                                          estEntierementLie
                                            ? "text-blue-700 bg-blue-50 px-2 py-1 rounded-md"
                                            : montantLie > 0
                                            ? "text-orange-700"
                                            : "text-gray-500"
                                        }`}
                                      >
                                        {formatCurrency(montantLie)}
                                      </span>
                                    </div>
                                  );
                                })()}
                              </TableCell>
                              <TableCell>
                                {(() => {
                                  const montantLie = versement.affectationsVersement?.reduce(
                                    (sum, aff) => sum + aff.montant,
                                    0
                                  ) || 0;
                                  const estComplet = montantLie >= versement.montant;
                                  const estEnPartie = montantLie > 0 && montantLie < versement.montant;
                                  const estSansFacture = montantLie === 0;

                                  let statutText = "";
                                  let statutClass = "";

                                  if (estComplet) {
                                    statutText = "Complet";
                                    statutClass = "bg-green-100 text-green-700 border-green-300";
                                  } else if (estEnPartie) {
                                    statutText = "En partie";
                                    statutClass = "bg-orange-100 text-orange-700 border-orange-300";
                                  } else if (estSansFacture) {
                                    statutText = "Sans facture";
                                    statutClass = "bg-gray-100 text-gray-600 border-gray-300";
                                  }

                                  return (
                                    <span
                                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${statutClass}`}
                                    >
                                      {statutText}
                                    </span>
                                  );
                                })()}
                              </TableCell>
                              <TableCell>
                                {versement.sourceCompte ? (
                                  <span className="font-medium">
                                    {versement.sourceCompte.compte}
                                  </span>
                                ) : (
                                  <span className="text-gray-400 text-sm italic">—</span>
                                )}
                              </TableCell>
                              <TableCell>
                                {versement.reference ? (
                                  <span className="text-sm">{versement.reference}</span>
                                ) : (
                                  <span className="text-gray-400 text-sm">—</span>
                                )}
                              </TableCell>
                              <TableCell>
                                {versement.note ? (
                                  <span className="text-sm text-gray-700">
                                    {versement.note}
                                  </span>
                                ) : (
                                  <span className="text-gray-400 text-sm">—</span>
                                )}
                              </TableCell>
                              <TableCell className="text-right">
                                <DropdownMenu
                                  open={openMenuId === versement.id}
                                  onOpenChange={(open) => {
                                    setOpenMenuId(open ? versement.id : null);
                                  }}
                                >
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 rounded-full hover:bg-gray-200"
                                    >
                                      <MoreVertical className="h-4 w-4" />
                                      <span className="sr-only">Ouvrir le menu</span>
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="w-72 rounded-md">
                                    <DropdownMenuItem
                                      onClick={() => {
                                        setSelectedVersement(versement);
                                        setEditVersementDialogOpen(true);
                                        setOpenMenuId(null);
                                      }}
                                      className="flex items-center gap-2 cursor-pointer group hover:!bg-purple-100"
                                    >
                                      <Pen className="h-4 w-4 text-purple-600 group-hover:text-purple-600" />
                                      <span className="transition-colors duration-200 group-hover:text-purple-600">
                                        Modifier
                                      </span>
                                    </DropdownMenuItem>
                                    {(() => {
                                      const montantLie = versement.affectationsVersement?.reduce(
                                        (sum, aff) => sum + aff.montant,
                                        0
                                      ) || 0;
                                      const estComplet = montantLie >= versement.montant;
                                      if (!estComplet) {
                                        return (
                                          <DropdownMenuItem
                                            onClick={() => {
                                              setVersementForFacture(versement);
                                              setFactureDialogOpen(true);
                                              setOpenMenuId(null);
                                            }}
                                            className="flex items-center gap-2 cursor-pointer group hover:!bg-emerald-100"
                                          >
                                            <FileText className="h-4 w-4 text-emerald-600" />
                                            <span className="transition-colors duration-200 group-hover:text-emerald-600">
                                              Créer une facture
                                            </span>
                                          </DropdownMenuItem>
                                        );
                                      }
                                      return null;
                                    })()}
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      onClick={() => {
                                        setSelectedVersement(versement);
                                        setDeleteDialog(true);
                                        setOpenMenuId(null);
                                      }}
                                      className="flex items-center gap-2 cursor-pointer group hover:!bg-red-100"
                                    >
                                      <Trash2 className="h-4 w-4 text-red-600" />
                                      <span className="transition-colors duration-200 group-hover:text-red-600">
                                        Supprimer
                                      </span>
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            </TableRow>
                            {isExpanded && hasAffectations && (
                              <TableRow>
                                <TableCell colSpan={9} className="bg-gray-50 p-4">
                                  <div className="space-y-3">
                                    <h4 className="font-semibold text-sm text-gray-700 mb-3">
                                      Affectations versement ({versement.affectationsVersement.length})
                                    </h4>
                                    <div className="border rounded-lg overflow-hidden">
                                      <Table>
                                        <TableHeader>
                                          <TableRow className="bg-gray-100">
                                            <TableHead className="w-32">Numéro facture</TableHead>
                                            <TableHead>Date facture</TableHead>
                                            <TableHead>Client</TableHead>
                                            <TableHead className="text-right">Montant facture</TableHead>
                                            <TableHead className="text-right">Montant affecté</TableHead>
                                          </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                          {versement.affectationsVersement.map((affectation) => (
                                            <TableRow key={affectation.id}>
                                              <TableCell>
                                                <span className="font-medium text-sm">
                                                  {affectation.facture.numero || "—"}
                                                </span>
                                              </TableCell>
                                              <TableCell>
                                                {affectation.facture.date ? (
                                                  <span className="text-sm">
                                                    {formatDate(affectation.facture.date)}
                                                  </span>
                                                ) : (
                                                  <span className="text-gray-400 text-sm">—</span>
                                                )}
                                              </TableCell>
                                              <TableCell>
                                                <span className="text-sm">
                                                  {affectation.facture.client.nom}
                                                </span>
                                              </TableCell>
                                              <TableCell className="text-right">
                                                <span className="text-sm font-medium">
                                                  {affectation.facture.total ? formatCurrency(affectation.facture.total) : "—"}
                                                </span>
                                              </TableCell>
                                              <TableCell className="text-right">
                                                <span className="font-semibold text-blue-700">
                                                  {formatCurrency(affectation.montant)}
                                                </span>
                                              </TableCell>
                                            </TableRow>
                                          ))}
                                        </TableBody>
                                      </Table>
                                    </div>
                                  </div>
                                </TableCell>
                              </TableRow>
                            )}
                          </>
                          );
                        })}
                        </TableBody>
                      </Table>

                      {/* Pagination */}
                      {versementsQuery.data?.pagination?.totalPages > 1 && (
                        <div className="p-4 border-t">
                          <CustomPagination
                            currentPage={page}
                            setCurrentPage={setPage}
                            totalPages={versementsQuery.data.pagination.totalPages}
                          />
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-12 text-gray-500">
                      {versementsQuery.data?.versements?.length === 0
                        ? "Aucun versement enregistré"
                        : "Aucun résultat trouvé pour votre recherche"}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

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
          }
        }}
      >
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">
              Versement vers compte professionnel
            </DialogTitle>
            <DialogDescription>
              Effectuer un versement depuis un compte vers le compte professionnel
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
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
              }}
            >
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Modifier versement */}
      <Dialog
        open={editVersementDialogOpen}
        onOpenChange={(open) => {
          setEditVersementDialogOpen(open);
          if (!open) {
            setSelectedVersement(null);
            setEditVersementMontant("");
            setEditVersementSourceCompteId(NO_SOURCE_VALUE);
            setEditVersementReference("");
            setEditVersementNote("");
          } else if (selectedVersement) {
            // Initialiser les valeurs quand le dialog s'ouvre (le useEffect le fait aussi)
            setEditVersementMontant(selectedVersement.montant.toString());
            setEditVersementSourceCompteId(selectedVersement.sourceCompte?.id ?? NO_SOURCE_VALUE);
            setEditVersementReference(selectedVersement.reference ?? "");
            setEditVersementNote(selectedVersement.note ?? "");
          }
        }}
      >
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">
              Modifier le versement
            </DialogTitle>
            <DialogDescription>
              Modifier les informations du versement
            </DialogDescription>
          </DialogHeader>

          {selectedVersement && (
            <div className="space-y-4 py-4">
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-montant" className="text-left text-black">
                    Montant (DH) *
                  </Label>
                  <Input
                    id="edit-montant"
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="0.00"
                    value={editVersementMontant}
                    onChange={(e) => setEditVersementMontant(e.target.value)}
                    className="bg-white"
                  />
                  {(() => {
                    const montantTotalAffecte = selectedVersement.affectationsVersement?.reduce(
                      (sum, aff) => sum + aff.montant,
                      0
                    ) || 0;
                    if (montantTotalAffecte > 0) {
                      return (
                        <p className="text-xs text-orange-600">
                          Montant déjà affecté: {formatCurrency(montantTotalAffecte)}. Le nouveau montant doit être au moins égal à ce montant.
                        </p>
                      );
                    }
                    return null;
                  })()}
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="edit-source" className="text-left text-black">
                    Compte source {selectedVersement.sourceCompte ? "*" : "(optionnel)"}
                  </Label>
                  <Select
                    value={editVersementSourceCompteId || NO_SOURCE_VALUE}
                    onValueChange={(value) => setEditVersementSourceCompteId(value)}
                  >
                    <SelectTrigger className="bg-white">
                      <SelectValue placeholder="Sélectionner un compte (optionnel)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NO_SOURCE_VALUE}>Aucun compte source</SelectItem>
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
                  <Label htmlFor="edit-reference" className="text-left text-black">
                    Référence (optionnel)
                  </Label>
                  <Input
                    id="edit-reference"
                    placeholder="Référence du versement"
                    value={editVersementReference}
                    onChange={(e) => setEditVersementReference(e.target.value)}
                    className="bg-white"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="edit-note" className="text-left text-black">
                    Note (optionnel)
                  </Label>
                  <Input
                    id="edit-note"
                    placeholder="Note ou description"
                    value={editVersementNote}
                    onChange={(e) => setEditVersementNote(e.target.value)}
                    className="bg-white"
                  />
                </div>
              </div>

              <Button
                className="rounded-full bg-purple-600 hover:bg-purple-700 text-white w-full"
                onClick={() => {
                  const montant = parseFloat(editVersementMontant);
                  if (!montant || montant <= 0) {
                    toast.error("Veuillez saisir un montant valide");
                    return;
                  }
                  // Le compte source est optionnel pour les versements créés depuis des paiements de devis

                  // Vérifier que le nouveau montant n'est pas inférieur au montant déjà affecté
                  const montantTotalAffecte = selectedVersement.affectationsVersement?.reduce(
                    (sum, aff) => sum + aff.montant,
                    0
                  ) || 0;

                  if (montant < montantTotalAffecte) {
                    toast.error(
                      `Le montant ne peut pas être inférieur au montant déjà affecté (${formatCurrency(montantTotalAffecte)})`
                    );
                    return;
                  }

                  // Vérifier le solde si le compte source a changé ou si le montant a augmenté
                  const effectiveNewSourceId =
                    editVersementSourceCompteId && editVersementSourceCompteId !== NO_SOURCE_VALUE
                      ? editVersementSourceCompteId
                      : undefined;
                  const compteSourceChange =
                    (selectedVersement.sourceCompte?.id ?? null) !== (effectiveNewSourceId ?? null);
                  const montantChange = montant !== selectedVersement.montant;

                  if (compteSourceChange || (montantChange && montant > selectedVersement.montant)) {
                    const sourceCompte = effectiveNewSourceId
                      ? comptes.data?.find((c: { id: string }) => c.id === effectiveNewSourceId)
                      : undefined;

                    if (compteSourceChange) {
                      // Nouveau compte source, vérifier qu'il a assez de solde pour le nouveau montant
                      if (sourceCompte && sourceCompte.solde < montant) {
                        toast.error(
                          `Solde insuffisant dans le nouveau compte source. Solde disponible: ${formatCurrency(sourceCompte.solde)}`
                        );
                        return;
                      }
                    } else {
                      // Même compte source, vérifier la différence
                      const difference = montant - selectedVersement.montant;
                      if (sourceCompte && sourceCompte.solde < difference) {
                        toast.error(
                          `Solde insuffisant. Solde disponible: ${formatCurrency(sourceCompte.solde)}, différence nécessaire: ${formatCurrency(difference)}`
                        );
                        return;
                      }
                    }
                  }

                  updateVersementMutation.mutate({
                    id: selectedVersement.id,
                    montant,
                    ...(effectiveNewSourceId && { sourceCompteId: effectiveNewSourceId }),
                    ...(editVersementReference && { reference: editVersementReference }),
                    ...(editVersementNote && { note: editVersementNote }),
                  });
                }}
                disabled={
                  updateVersementMutation.isLoading ||
                  !editVersementMontant
                }
              >
                {updateVersementMutation.isLoading ? (
                  <>
                    <LoadingDots />
                    <span className="ml-2">Traitement...</span>
                  </>
                ) : (
                  "Enregistrer les modifications"
                )}
              </Button>
            </div>
          )}

          <DialogFooter>
            <Button
              className="rounded-full"
              variant="outline"
              onClick={() => {
                setEditVersementDialogOpen(false);
                setSelectedVersement(null);
                setEditVersementMontant("");
                setEditVersementSourceCompteId("");
                setEditVersementReference("");
                setEditVersementNote("");
              }}
            >
              Annuler
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Confirmation suppression */}
      <DeleteConfirmationDialog
        recordName={
          selectedVersement
            ? selectedVersement.reference
              ? `le versement "${selectedVersement.reference}"`
              : "le versement"
            : "le versement"
        }
        isOpen={deleteDialog}
        onClose={() => {
          setDeleteDialog(false);
          setSelectedVersement(null);
        }}
        onConfirm={() => {
          if (selectedVersement) {
            deleteVersementMutation.mutate(selectedVersement.id);
          }
        }}
      />

      {/* Dialog Créer facture depuis versement */}
      <CreateFactureFromVersementDialog
        versement={versementForFacture}
        open={factureDialogOpen}
        onOpenChange={(open: boolean) => {
          setFactureDialogOpen(open);
          if (!open) {
            setVersementForFacture(null);
          }
        }}
      />

      {/* Dialog Créer facture depuis plusieurs versements */}
      <CreateFactureFromMultipleVersementsDialog
        open={multipleVersementsDialogOpen}
        onOpenChange={setMultipleVersementsDialogOpen}
      />
    </>
  );
}

export default function Versements() {
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
      <VersementsContent />
    </Suspense>
  );
}

