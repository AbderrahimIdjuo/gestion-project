"use client";

import CustomDateRangePicker from "@/components/customUi/customDateRangePicker";
import CustomPagination from "@/components/customUi/customPagination";
import { PriceRangeSlider } from "@/components/customUi/customSlider";
import { AddButton } from "@/components/customUi/styledButton";
import { DeleteConfirmationDialog } from "@/components/delete-confirmation-dialog";
import { DevisActions } from "@/components/devis-actions";
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatCurrency, methodePaiementLabel } from "@/lib/functions";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import {
  CalendarDays,
  ChevronDown,
  CircleDollarSign,
  CreditCard,
  Filter,
  Landmark,
  OctagonAlert,
  OctagonMinus,
  Printer,
  Search,
  Trash2,
  X,
} from "lucide-react";
import Link from "next/link";
import { Fragment, useEffect, useState } from "react";
import toast, { Toaster } from "react-hot-toast";

// Valeurs par défaut pour la visibilité des colonnes (toutes visibles par défaut)
const defaultVisibleColumns = {
  date: true,
  dateStart: true,
  dateEnd: true,
  numero: true,
  client: true,
  commercant: true,
  montantTotal: true,
  fournitures: true,
  marge: true,
  margePercent: true,
  paye: true,
  reste: true,
  statut: true,
};

export default function DevisPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState();
  const [currentDevi, setCurrentDevi] = useState();
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [maxMontant, setMaxMontant] = useState();
  const [startDate, setStartDate] = useState();
  const [endDate, setEndDate] = useState();
  const [dateStartFrom, setDateStartFrom] = useState();
  const [dateStartTo, setDateStartTo] = useState();
  const [dateEndFrom, setDateEndFrom] = useState();
  const [dateEndTo, setDateEndTo] = useState();
  const [transactions, setTransactions] = useState();
  const [BlGroups, setBlGroups] = useState();
  const [expandedDevis, setExpandedDevis] = useState(null);
  const [info, setInfo] = useState(false);
  const [deleteTransDialog, setDeleteTransDialog] = useState(false);
  const [deletedTrans, setDeletedTrans] = useState();
  const [statutChangeDialog, setStatutChangeDialog] = useState(false);
  const [pendingStatutChange, setPendingStatutChange] = useState(null);

  // Configuration des colonnes avec leurs labels
  const columnDefinitions = [
    { key: "date", label: "Date" },
    { key: "dateStart", label: "Début" },
    { key: "dateEnd", label: "Fin" },
    { key: "numero", label: "Numéro" },
    { key: "client", label: "Client" },
    { key: "commercant", label: "Commerçant" },
    { key: "montantTotal", label: "Montant total" },
    { key: "fournitures", label: "Fournitures" },
    { key: "marge", label: "Marge" },
    { key: "margePercent", label: "%" },
    { key: "paye", label: "Payé" },
    { key: "reste", label: "Reste" },
    { key: "statut", label: "Statut" },
  ];

  // État pour la visibilité des colonnes (initialisé avec les valeurs par défaut pour éviter les erreurs d'hydratation)
  const [visibleColumns, setVisibleColumns] = useState(defaultVisibleColumns);
  const [isColumnsLoaded, setIsColumnsLoaded] = useState(false);

  // Charger les préférences depuis localStorage après le montage (côté client uniquement)
  useEffect(() => {
    if (typeof window !== "undefined" && !isColumnsLoaded) {
      const saved = localStorage.getItem("devis-visible-columns");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          // S'assurer que toutes les colonnes sont présentes (au cas où de nouvelles colonnes ont été ajoutées)
          setVisibleColumns({ ...defaultVisibleColumns, ...parsed });
        } catch (e) {
          // Si erreur de parsing, utiliser les valeurs par défaut
          console.error("Error parsing visible columns from localStorage:", e);
        }
      }
      setIsColumnsLoaded(true);
    }
  }, [isColumnsLoaded]);

  const getUsers = async () => {
    const response = await axios.get("/api/users");
    console.log("users :", response.data);

    return response.data;
  };

  // Fonction pour récupérer le nom de l'utilisateur par son ID
  const getUserName = userId => {
    if (!userId || !users.data) return "";
    const user = users.data.find(u => u.id === userId);
    return user ? user.nom : "";
  };

  const users = useQuery({
    queryKey: ["users"],
    queryFn: getUsers,
  });
  const deleteTrans = useMutation({
    mutationFn: async id => {
      const loadingToast = toast.loading("Suppression...");
      try {
        await axios.delete("/api/tresorie", {
          params: {
            id,
          },
        });
        toast(<span>Paiement supprimé avec succée!</span>, {
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
      queryClient.invalidateQueries({ queryKey: ["devis"] });
    },
  });
  const toggleExpand = devisId => {
    setExpandedDevis(expandedDevis === devisId ? null : devisId);
  };
  const [filters, setFilters] = useState({
    dateStart: "",
    dateEnd: "",
    montant: [0, maxMontant],
    statut: [],
    statutPaiement: [],
    commercant: "all",
  });
  const queryClient = useQueryClient();
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery);
      setPage(1);
    }, 500); // Adjust delay as needed

    return () => {
      clearTimeout(handler);
    };
  }, [searchQuery]);

  // Fonctions pour gérer les statuts multiples
  const handleStatutChange = (statut, checked) => {
    setFilters(prev => ({
      ...prev,
      statut: checked
        ? [...prev.statut, statut]
        : prev.statut.filter(s => s !== statut),
    }));
  };

  const removeStatut = statut => {
    setFilters(prev => ({
      ...prev,
      statut: prev.statut.filter(s => s !== statut),
    }));
  };

  const handleStatutPaiementChange = (statut, checked) => {
    setFilters(prev => ({
      ...prev,
      statutPaiement: checked
        ? [...prev.statutPaiement, statut]
        : prev.statutPaiement.filter(s => s !== statut),
    }));
  };

  const removeStatutPaiement = statut => {
    setFilters(prev => ({
      ...prev,
      statutPaiement: prev.statutPaiement.filter(s => s !== statut),
    }));
  };

  // Réinitialiser la page à 1 lorsque les filtres changent
  useEffect(() => {
    setPage(1);
  }, [
    filters.statut,
    filters.statutPaiement,
    filters.commercant,
    filters.montant,
    startDate,
    endDate,
    dateStartFrom,
    dateStartTo,
    dateEndFrom,
    dateEndTo,
  ]);
  const devis = useQuery({
    queryKey: [
      "devis",
      filters.statut,
      debouncedQuery,
      page,
      startDate,
      endDate,
      dateStartFrom,
      dateStartTo,
      dateEndFrom,
      dateEndTo,
      filters.montant,
      filters.statutPaiement,
      filters.commercant,
    ],
    queryFn: async () => {
      const response = await axios.get("/api/devis", {
        params: {
          query: debouncedQuery,
          page,
          statut: filters.statut.length > 0 ? filters.statut.join("-") : "all",
          from: startDate,
          to: endDate,
          dateStartFrom: dateStartFrom,
          dateStartTo: dateStartTo,
          dateEndFrom: dateEndFrom,
          dateEndTo: dateEndTo,
          minTotal: filters.montant[0],
          maxTotal: filters.montant[1],
          statutPaiement:
            filters.statutPaiement.length > 0
              ? filters.statutPaiement.join("-")
              : "all",
          commercant: filters.commercant,
        },
      });
      console.log("Devis :", response.data.devis);

      setBlGroups(response.data.bLGroupsList);
      setTransactions(response.data.transactionsList);
      setMaxMontant(response.data.maxMontant);
      setTotalPages(response.data.totalPages);
      return response.data.devis;
    },
    keepPreviousData: true, // Keeps old data visible while fetching new page
    refetchOnWindowFocus: false,
  });

  // intialiser les valeure du monatant total handler
  useEffect(() => {
    setFilters(prev => ({ ...prev, montant: [0, maxMontant] }));
  }, [maxMontant]);

  // Sauvegarder les colonnes visibles dans localStorage (seulement après le chargement initial)
  useEffect(() => {
    if (typeof window !== "undefined" && isColumnsLoaded) {
      localStorage.setItem(
        "devis-visible-columns",
        JSON.stringify(visibleColumns)
      );
    }
  }, [visibleColumns, isColumnsLoaded]);

  // Fonction pour toggle la visibilité d'une colonne
  const toggleColumn = columnKey => {
    setVisibleColumns(prev => ({
      ...prev,
      [columnKey]: !prev[columnKey],
    }));
  };


  const getStatutColor = statut => {
    switch (statut) {
      case "En attente":
        return "bg-amber-100 text-amber-700";
      case "Accepté":
        return "bg-green-100 text-green-700";
      case "Annulé":
        return "bg-red-100 text-red-700";
      case "Terminer":
        return "bg-purple-100 text-purple-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };
  function formatDate(dateString) {
    return dateString?.split("T")[0].split("-").reverse().join("-");
  }
  const deleteDevi = useMutation({
    mutationFn: async id => {
      const loadingToast = toast.loading("Suppression...");
      try {
        await axios.delete(`/api/devis/${id}`);
        toast(
          <span>
            Le devi numéro : <b>{currentDevi?.numero?.toUpperCase()}</b> a été
            supprimé avec succès!
          </span>,
          { icon: "🗑️" }
        );
        // console.log("devi supprimée avec succès !");
      } catch (error) {
        console.error("Erreur lors de la suppression :", error);
        toast.error("Échec de la suppression");
        throw error; // Relancez l'erreur pour que `onError` soit déclenché
      } finally {
        toast.dismiss(loadingToast);
        setCurrentDevi(null);
        setDeleteDialogOpen(false);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["devis"]);
    },
    onError: error => {
      console.error("Erreur lors de la suppression :", error);
    },
  });

  const updateStatut = useMutation({
    mutationFn: async ({ id, statut }) => {
      try {
        await axios.patch(`/api/devis/${id}`, { statut });
        toast.success("Statut mis à jour avec succès!");
      } catch (error) {
        console.error("Erreur lors de la mise à jour du statut :", error);
        toast.error("Échec de la mise à jour du statut");
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["devis"]);
    },
  });

  const status = [
    { value: "all", lable: "Tous", color: "" },
    { value: "En attente", lable: "En attente", color: "amber-500" },
    { value: "Accepté", lable: "Accepté", color: "green-500" },
    { value: "Annulé", lable: "Annulé", color: "red-500" },
    { value: "Terminer", lable: "Terminer", color: "purple-500" },
  ];
  const totalFourniture = group => {
    return group?.reduce((acc, item) => {
      const type = item?.bonLivraison?.type;

      if (type === "achats") {
        return acc + totalBlFourniture(item.produits);
      } else if (type === "retour") {
        return acc - totalBlFourniture(item.produits);
      }

      return acc; // si type inconnu
    }, 0);
  };

  const totalBlFourniture = produits => {
    return produits?.reduce((acc, produit) => {
      return acc + produit.quantite * produit.prixUnite;
    }, 0);
  };

  const filteredOrders = numero => {
    const list = BlGroups?.filter(order => {
      return order.devisNumero === numero;
    });
    return list;
  };

  const transactionsDevis = numero => {
    const trans = transactions?.filter(c => c.reference === numero);
    return trans;
  };

  const statutPaiement = devis => {
    if (!devis || !devis.statutPaiement) {
      return { lable: "Impayé", color: "bg-slate-100 text-slate-600"};
    }

    switch (devis.statutPaiement) {
      case "paye":
        return { lable: "Payé", color: "bg-green-100 text-green-600"};
      case "enPartie":
        return { lable: "En partie", color: "bg-orange-100 text-orange-500" };
      case "impaye":
        return { lable: "Impayé", color: "bg-slate-100 text-slate-600" };
      default:
        return { lable: "Impayé", color: "bg-slate-100 text-slate-600" };
    }
  };

  const statutPaiements = [
    { lable: "Tous", value: "all", color: "" },
    { lable: "Payé", value: "paye", color: "green" },
    { lable: "Impayé", value: "impaye", color: "gray" },
    { lable: "En partie", value: "enPartie", color: "amber" },
  ];

  function calculateMarge(devis, totalFourniture) {
    if (
      totalFourniture === null ||
      totalFourniture === undefined ||
      totalFourniture === 0 ||
      devis.statut === "En attente"
    ) {
      return "";
    }
    const diff = devis.total - totalFourniture;
    if (totalFourniture > 0) {
      return formatCurrency(diff);
    }
    return "";
  }

  function calculateMargePercent(devis, totalFourniture) {
    if (
      totalFourniture === null ||
      totalFourniture === undefined ||
      devis.total === 0 ||
      devis.statut === "En attente" ||
      totalFourniture === 0
    ) {
      return { percent: "", color: "" };
    }
    const marge = devis.total - totalFourniture;
    const percent = (marge / devis.total) * 100;

    // Diviser 100% en 5 ranges avec couleurs du vert au rouge
    let colorClass = "";
    if (percent >= 80) {
      // 80-100% : Vert (excellent)
      colorClass = "text-green-600 font-bold";
    } else if (percent >= 60) {
      // 60-79% : Vert clair (bon)
      colorClass = "text-green-500 font-semibold";
    } else if (percent >= 40) {
      // 40-59% : Jaune/Orange (moyen)
      colorClass = "text-yellow-500 font-semibold";
    } else if (percent >= 20) {
      // 20-39% : Orange (faible)
      colorClass = "text-orange-500 font-semibold";
    } else {
      // 0-19% : Rouge (très faible)
      colorClass = "text-red-500 font-bold";
    }

    return {
      percent: percent.toFixed(2) + "%",
      color: colorClass,
    };
  }
  const employes = useQuery({
    queryKey: ["employes"],
    queryFn: async () => {
      const response = await axios.get("/api/employes");
      console.log("employes ###:", response.data.employes);
      return response.data.employes;
    },
  });
  const commercants = useQuery({
    queryKey: ["commercants"],
    queryFn: async () => {
      const response = await axios.get("/api/employes/managersList");
      console.log("Commercants ###:", response.data.employes);
      return response.data.employes;
    },
  });

  return (
    <>
      <Toaster position="top-center"></Toaster>
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
                <div className="flex justify-between items-center">
                  <h1 className="text-3xl font-bold">Devis</h1>
                </div>

                <div className="flex flex-col sm:flex-row justify-between items-center space-y-2 sm:space-y-0 sm:space-x-4 mb-2">
                  <div className="relative w-full sm:w-96">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Rechercher par numéro, client ou commerçant..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="pl-9 w-full rounded-full bg-gray-50 focus-visible:ring-purple-500 focus-visible:ring-offset-0"
                      spellCheck={false}
                    />
                    <div className="absolute right-6 top-1/3 h-4 w-4 -translate-y-1/2 text-muted-foreground">
                      {devis.isFetching && !devis.isLoading && <LoadingDots />}
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
                            devis.
                          </SheetDescription>
                        </SheetHeader>
                        <div className="grid gap-4 py-4">
                          <div className="grid grid-rows-2 grid-cols-4 items-center ">
                            <Label
                              htmlFor="statut"
                              className="text-left text-black col-span-4"
                            >
                              Statut :
                            </Label>
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  className="col-span-4 justify-between text-left font-normal focus:ring-2 focus:ring-purple-500 bg-white"
                                >
                                  <div className="flex flex-wrap gap-1">
                                    {filters.statut.length === 0 ? (
                                      <span className="text-muted-foreground">
                                        Sélectionner les statuts
                                      </span>
                                    ) : (
                                      filters.statut.map(statut => (
                                        <Badge
                                          key={statut}
                                          variant="secondary"
                                          className={`text-xs ${
                                            statut === "En attente"
                                              ? "bg-amber-100 text-amber-800 hover:bg-amber-200"
                                              : statut === "Accepté"
                                              ? "bg-green-100 text-green-800 hover:bg-green-200"
                                              : statut === "Annulé"
                                              ? "bg-red-100 text-red-800 hover:bg-red-200"
                                              : "bg-purple-100 text-purple-800 hover:bg-purple-200"
                                          }`}
                                        >
                                          {statut}
                                          <X
                                            className="ml-1 h-3 w-3 cursor-pointer hover:text-purple-600"
                                            onClick={e => {
                                              e.stopPropagation();
                                              removeStatut(statut);
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
                                  {status
                                    .filter(s => s.value !== "all")
                                    .map((statut, index) => (
                                      <div
                                        key={index}
                                        className="flex items-center space-x-2"
                                      >
                                        <Checkbox
                                          id={`statut-${statut.value}`}
                                          checked={filters.statut.includes(
                                            statut.value
                                          )}
                                          onCheckedChange={checked =>
                                            handleStatutChange(
                                              statut.value,
                                              checked
                                            )
                                          }
                                        />
                                        <Label
                                          htmlFor={`statut-${statut.value}`}
                                          className="text-sm font-medium cursor-pointer flex items-center gap-2"
                                        >
                                          <span
                                            className={`h-2 w-2 rounded-full bg-${statut.color}`}
                                          />
                                          {statut.lable}
                                        </Label>
                                      </div>
                                    ))}
                                </div>
                              </PopoverContent>
                            </Popover>
                          </div>
                          <div className="grid grid-cols-4 grid-rows-2 items-center ">
                            <Label
                              htmlFor="statutPaiement"
                              className="text-left text-black col-span-4"
                            >
                              Statut de Paiement :
                            </Label>
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  className="col-span-4 justify-between text-left font-normal focus:ring-2 focus:ring-purple-500 bg-white"
                                >
                                  <div className="flex flex-wrap gap-1">
                                    {filters.statutPaiement.length === 0 ? (
                                      <span className="text-muted-foreground">
                                        Sélectionner les statuts
                                      </span>
                                    ) : (
                                      filters.statutPaiement.map(statut => (
                                        <Badge
                                          key={statut}
                                          variant="secondary"
                                          className={`text-xs ${
                                            statut === "paye"
                                              ? "bg-green-100 text-green-800 hover:bg-green-200"
                                              : statut === "impaye"
                                              ? "bg-slate-100 text-slate-800 hover:bg-slate-200"
                                              : "bg-amber-100 text-amber-800 hover:bg-amber-200"
                                          }`}
                                        >
                                          {statut === "paye"
                                            ? "Payé"
                                            : statut === "impaye"
                                            ? "Impayé"
                                            : "En partie"}
                                          <X
                                            className="ml-1 h-3 w-3 cursor-pointer hover:text-purple-600"
                                            onClick={e => {
                                              e.stopPropagation();
                                              removeStatutPaiement(statut);
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
                                  {statutPaiements
                                    .filter(s => s.value !== "all")
                                    .map((statut, index) => (
                                      <div
                                        key={index}
                                        className="flex items-center space-x-2"
                                      >
                                        <Checkbox
                                          id={`statutPaiement-${statut.value}`}
                                          checked={filters.statutPaiement.includes(
                                            statut.value
                                          )}
                                          onCheckedChange={checked =>
                                            handleStatutPaiementChange(
                                              statut.value,
                                              checked
                                            )
                                          }
                                        />
                                        <Label
                                          htmlFor={`statutPaiement-${statut.value}`}
                                          className="text-sm font-medium cursor-pointer flex items-center gap-2"
                                        >
                                          <div
                                            className={`w-2 h-2 rounded-full bg-${statut.color}-500`}
                                          ></div>
                                          {statut.lable}
                                        </Label>
                                      </div>
                                    ))}
                                </div>
                              </PopoverContent>
                            </Popover>
                          </div>
                          <div className="grid grid-rows-2 grid-cols-4 items-center">
                            <Label
                              htmlFor="commercant"
                              className="text-left text-black col-span-4"
                            >
                              Commerçant :
                            </Label>
                            <Select
                              value={filters.commercant}
                              name="commercant"
                              onValueChange={value =>
                                setFilters({
                                  ...filters,
                                  commercant: value,
                                })
                              }
                            >
                              <SelectTrigger className="col-span-4 bg-white focus:ring-purple-500">
                                <SelectValue placeholder="Sélectionner un commerçant" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">
                                  <div className="flex items-center gap-2">
                                    Tous
                                  </div>
                                </SelectItem>
                                {employes.data?.map((employe, index) => (
                                  <SelectItem key={index} value={employe.nom}>
                                    <div className={`flex items-center gap-2`}>
                                      {employe.nom}
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="grid grid-cols-4 grid-rows-2 items-center">
                            <Label
                              htmlFor="statut"
                              className="text-left text-black col-span-4"
                            >
                              Date de création:
                            </Label>
                            <div className="col-span-4">
                              <CustomDateRangePicker
                                startDate={startDate}
                                setStartDate={setStartDate}
                                endDate={endDate}
                                setEndDate={setEndDate}
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-4 grid-rows-2 items-center">
                            <Label
                              htmlFor="dateStart"
                              className="col-span-4 text-left text-black"
                            >
                              Date de début :
                            </Label>
                            <div className="col-span-4">
                              <CustomDateRangePicker
                                startDate={dateStartFrom}
                                setStartDate={setDateStartFrom}
                                endDate={dateStartTo}
                                setEndDate={setDateStartTo}
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-4 grid-rows-2 items-center">
                            <Label
                              htmlFor="dateEnd"
                              className="col-span-4 text-left text-black"
                            >
                              Date de fin :
                            </Label>
                            <div className="col-span-4">
                              <CustomDateRangePicker
                                startDate={dateEndFrom}
                                setStartDate={setDateEndFrom}
                                endDate={dateEndTo}
                                setEndDate={setDateEndTo}
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-4 grid-rows-2 items-start">
                            <Label
                              htmlFor="montant"
                              className="text-left text-black col-span-4"
                            >
                              Montant total :
                            </Label>
                            <div className="col-span-4">
                              <PriceRangeSlider
                                min={0}
                                max={maxMontant}
                                step={100}
                                value={filters.montant} // Ensure montant is an array, e.g., [min, max]
                                onValueChange={value => {
                                  setFilters({ ...filters, montant: value }); // value will be [min, max]
                                }}
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
                    <Button
                      variant="outline"
                      onClick={() => {
                        const params = {
                          query: debouncedQuery,
                          statut:
                            filters.statut.length > 0
                              ? filters.statut.join("-")
                              : "all",
                          statutPaiement:
                            filters.statutPaiement.length > 0
                              ? filters.statutPaiement.join("-")
                              : "all",
                          from: startDate,
                          to: endDate,
                          dateStartFrom: dateStartFrom,
                          dateStartTo: dateStartTo,
                          dateEndFrom: dateEndFrom,
                          dateEndTo: dateEndTo,
                          minTotal: filters.montant[0],
                          maxTotal: filters.montant[1],
                          commercant: filters.commercant,
                        };
                        localStorage.setItem("params", JSON.stringify(params));
                        window.open("/ventes/devis/impression", "_blank");
                      }}
                      className="border-purple-500 bg-purple-100 text-purple-700 hover:bg-purple-200 hover:text-purple-900 rounded-full"
                    >
                      <Printer className="h-4 w-4" />
                      Imprimer
                    </Button>
                    <Link href="/ventes/devis/nouveau">
                      <AddButton title="Nouveau devis" />
                    </Link>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row justify-end">
                  <Popover>
                    <PopoverTrigger asChild>
                      {/* <Button
                          variant="outline"
                          className="border-purple-500 bg-purple-100 text-purple-700 hover:bg-purple-200 hover:text-purple-900 rounded-full"
                        >
                          <Columns className="mr-2 h-4 w-4" />
                          Colonnes
                        </Button> */}
                      <Button
                        variant="outline"
                        className="ml-auto rounded-full"
                      >
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
                                checked={visibleColumns[column.key]}
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

                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {visibleColumns.date && <TableHead>Date</TableHead>}
                        {visibleColumns.dateStart && (
                          <TableHead>Début</TableHead>
                        )}
                        {visibleColumns.dateEnd && <TableHead>Fin</TableHead>}
                        {visibleColumns.numero && <TableHead>Numéro</TableHead>}
                        {visibleColumns.client && <TableHead>Client</TableHead>}
                        {visibleColumns.commercant && (
                          <TableHead>Commerçant</TableHead>
                        )}
                        {visibleColumns.montantTotal && (
                          <TableHead className="text-right">
                            Montant total
                          </TableHead>
                        )}
                        {visibleColumns.fournitures && (
                          <TableHead className="text-right">
                            Fournitures
                          </TableHead>
                        )}
                        {visibleColumns.marge && (
                          <TableHead className="text-right">Marge</TableHead>
                        )}
                        {visibleColumns.margePercent && (
                          <TableHead className="text-right">%</TableHead>
                        )}
                        {visibleColumns.paye && (
                          <TableHead className="text-right">Payé</TableHead>
                        )}
                        {visibleColumns.reste && (
                          <TableHead className="text-right">Reste</TableHead>
                        )}
                        {visibleColumns.statut && <TableHead>Statut</TableHead>}
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {devis.isLoading ? (
                        [...Array(10)].map((_, index) => (
                          <TableRow
                            className="h-[2rem] MuiTableRow-root"
                            role="checkbox"
                            tabIndex={-1}
                            key={index}
                          >
                            {Object.values(visibleColumns)
                              .filter(Boolean)
                              .map((_, cellIndex) => (
                                <TableCell
                                  key={cellIndex}
                                  className="!py-2 text-sm md:text-base"
                                  align="left"
                                >
                                  <Skeleton className="h-4 w-full" />
                                </TableCell>
                              ))}
                            <TableCell className="!py-2">
                              <div className="flex gap-2 justify-end">
                                <Skeleton className="h-7 w-7 rounded-full" />
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : devis.data?.length > 0 ? (
                        devis.data?.map((devis, index) => (
                          <>
                            <Fragment key={devis.id}>
                              <TableRow>
                                {visibleColumns.date && (
                                  <TableCell className="!py-2">
                                    {formatDate(devis.date)}
                                  </TableCell>
                                )}
                                {visibleColumns.dateStart && (
                                  <TableCell className="!py-2">
                                    {devis.dateStart
                                      ? formatDate(devis.dateStart)
                                      : "-"}
                                  </TableCell>
                                )}
                                {visibleColumns.dateEnd && (
                                  <TableCell className="!py-2">
                                    {devis.dateEnd
                                      ? formatDate(devis.dateEnd)
                                      : "-"}
                                  </TableCell>
                                )}
                                {visibleColumns.numero && (
                                  <TableCell
                                    onClick={() => {
                                      toggleExpand(devis.id);
                                      if (devis.totalPaye !== 0) {
                                        if (currentDevi?.id === devis.id) {
                                          setInfo(!info);
                                        } else setInfo(true);
                                        setCurrentDevi(devis);
                                      }
                                    }}
                                    className={`font-medium !py-2  ${
                                      devis.total > 0 &&
                                      (devis.totalPaye === devis.total ||
                                        devis.totalPaye > devis.total) &&
                                      "cursor-pointer hover:text-green-400"
                                    } 
                                
                                ${
                                  devis.totalPaye !== 0 &&
                                  devis.totalPaye < devis.total &&
                                  "cursor-pointer hover:text-orange-400"
                                }`}
                                  >
                                    <div className="flex items-center gap-2">
                                      <span>{devis.numero}</span>
                                      <span
                                        className={`px-2 py-1 rounded-full text-xs font-semibold uppercase ${
                                          statutPaiement(devis)?.color
                                        }`}
                                      >
                                        {statutPaiement(devis)?.lable}
                                      </span>
                                      {(() => {
                                        const fourniture = totalFourniture(
                                          filteredOrders(devis.numero)
                                        );
                                        const montantPaye = devis.totalPaye;
                                        const shouldShowWarning =
                                          fourniture > montantPaye;

                                        return shouldShowWarning ? (
                                          <TooltipProvider>
                                            <Tooltip>
                                              <TooltipTrigger asChild>
                                                <OctagonAlert className="h-5 w-5 text-amber-500 cursor-help" />
                                              </TooltipTrigger>
                                              <TooltipContent>
                                                <p className="font-medium">
                                                  Fourniture supérieure au
                                                  montant payé
                                                </p>
                                              </TooltipContent>
                                            </Tooltip>
                                          </TooltipProvider>
                                        ) : null;
                                      })()}
                                      {(() => {
                                        const paiementStatut =
                                          statutPaiement(devis);
                                        const shouldShowWarning =
                                          devis.statut === "Terminer" &&
                                          (paiementStatut?.lable ===
                                            "En partie" ||
                                            paiementStatut?.lable === "Impayé");

                                        return shouldShowWarning ? (
                                          <TooltipProvider>
                                            <Tooltip>
                                              <TooltipTrigger asChild>
                                                <OctagonMinus className="h-5 w-5 text-red-500 cursor-help" />
                                              </TooltipTrigger>
                                              <TooltipContent>
                                                <p className="font-medium">
                                                  Devis terminé avec paiement
                                                  incomplet
                                                </p>
                                              </TooltipContent>
                                            </Tooltip>
                                          </TooltipProvider>
                                        ) : null;
                                      })()}
                                    </div>
                                  </TableCell>
                                )}
                                {visibleColumns.client && (
                                  <TableCell className="!py-2">
                                    {devis.client.nom.toUpperCase()}
                                  </TableCell>
                                )}
                                {visibleColumns.commercant && (
                                  <TableCell className="!py-2">
                                    {devis.commercant?.nom.toUpperCase()}
                                  </TableCell>
                                )}
                                {visibleColumns.montantTotal && (
                                  <TableCell className="!py-2  text-right">
                                    {formatCurrency(devis.total)}
                                  </TableCell>
                                )}
                                {visibleColumns.fournitures && (
                                  <TableCell className="!py-2 text-right">
                                    {formatCurrency(
                                      totalFourniture(
                                        filteredOrders(devis.numero)
                                      )
                                    )}
                                  </TableCell>
                                )}
                                {visibleColumns.marge && (
                                  <TableCell className="!py-2 text-right">
                                    {calculateMarge(
                                      devis,
                                      totalFourniture(
                                        filteredOrders(devis.numero)
                                      )
                                    )}
                                  </TableCell>
                                )}
                                {visibleColumns.margePercent && (
                                  <TableCell className="!py-2 text-right">
                                    {(() => {
                                      const result = calculateMargePercent(
                                        devis,
                                        totalFourniture(
                                          filteredOrders(devis.numero)
                                        )
                                      );
                                      return result.percent ? (
                                        <span className={result.color}>
                                          {result.percent}
                                        </span>
                                      ) : (
                                        ""
                                      );
                                    })()}
                                  </TableCell>
                                )}
                                {visibleColumns.paye && (
                                  <TableCell className="!py-2 text-right">
                                    {formatCurrency(devis.totalPaye)}
                                  </TableCell>
                                )}
                                {visibleColumns.reste && (
                                  <TableCell className="!py-2 text-right">
                                    {formatCurrency(
                                      devis.total.toFixed(2) -
                                        devis.totalPaye.toFixed(2)
                                    )}
                                  </TableCell>
                                )}
                                {visibleColumns.statut && (
                                  <TableCell className="!py-2">
                                    <Select
                                      value={devis.statut}
                                      onValueChange={value => {
                                        // Ouvrir le dialogue de confirmation au lieu d'appliquer directement
                                        setPendingStatutChange({
                                          id: devis.id,
                                          statut: value,
                                          currentStatut: devis.statut,
                                          numero: devis.numero,
                                        });
                                        setStatutChangeDialog(true);
                                      }}
                                      disabled={updateStatut.isPending}
                                    >
                                      <SelectTrigger className="h-8 w-[130px] text-xs border-0 bg-transparent hover:bg-gray-50">
                                        <SelectValue>
                                          <span
                                            className={`text-xs px-2 py-1 rounded-full ${getStatutColor(
                                              devis.statut
                                            )}`}
                                          >
                                            {devis.statut}
                                          </span>
                                        </SelectValue>
                                      </SelectTrigger>
                                      <SelectContent>
                                        {status
                                          .filter(s => s.value !== "all")
                                          .map((statut, index) => (
                                            <SelectItem
                                              key={index}
                                              value={statut.value}
                                            >
                                              <span className="flex items-center gap-2">
                                                <span
                                                  className={`h-2 w-2 rounded-full bg-${statut.color}`}
                                                />
                                                {statut.lable}
                                              </span>
                                            </SelectItem>
                                          ))}
                                      </SelectContent>
                                    </Select>
                                  </TableCell>
                                )}
                                <TableCell className="text-right !py-2">
                                  <DevisActions
                                    devis={devis}
                                    setDeleteDialogOpen={setDeleteDialogOpen}
                                    setCurrentDevi={setCurrentDevi}
                                    bLGroups={filteredOrders(devis.numero)}
                                  />
                                </TableCell>
                              </TableRow>
                              {info && expandedDevis === devis.id && (
                                <TableRow>
                                  <TableCell
                                    colSpan={
                                      Object.values(visibleColumns).filter(
                                        Boolean
                                      ).length + 1
                                    }
                                    className="p-0"
                                  >
                                    <div className="px-8 py-6 animate-in slide-in-from-top-2 duration-200">
                                      <div className="space-y-6">
                                        {/* Header Section */}
                                        <div className="flex justify-between items-center">
                                          <h4 className="text-lg font-semibold text-gray-900">
                                            Historique des paiements
                                          </h4>
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            className="bg-purple-500 hover:bg-purple-600 !text-white rounded-full"
                                            onClick={() => {
                                              window.open(
                                                `/ventes/devis/${devis.id}/historiquePaiements`,
                                                "_blank"
                                              );
                                              localStorage.setItem(
                                                "devis",
                                                JSON.stringify(devis)
                                              );
                                              localStorage.setItem(
                                                "transactions",
                                                JSON.stringify(
                                                  transactionsDevis(
                                                    devis.numero
                                                  )
                                                )
                                              );
                                            }}
                                          >
                                            <Printer className="h-4 w-4" />
                                            Imprimer
                                          </Button>
                                        </div>

                                        {/* Table Section */}
                                        <div className="border rounded-lg overflow-hidden">
                                          <Table>
                                            <TableBody>
                                              {transactionsDevis(
                                                devis.numero
                                              )?.map(trans => (
                                                <TableRow
                                                  key={trans.id}
                                                  className="hover:bg-gray-50/50 transition-colors"
                                                >
                                                  <TableCell className="font-medium">
                                                    <div className="flex items-center gap-3">
                                                      <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
                                                        <CalendarDays className="h-4 w-4" />
                                                      </div>
                                                      <span className="text-gray-900">
                                                        {formatDate(
                                                          trans.date
                                                        ) ||
                                                          formatDate(
                                                            trans.createdAt
                                                          )}
                                                      </span>
                                                    </div>
                                                  </TableCell>
                                                  <TableCell>
                                                    <div className="flex items-center gap-3">
                                                      <div className="w-8 h-8 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
                                                        <CircleDollarSign className="h-4 w-4" />
                                                      </div>
                                                      <span className="font-semibold text-emerald-700">
                                                        {trans.montant} DH
                                                      </span>
                                                    </div>
                                                  </TableCell>
                                                  <TableCell>
                                                    <div className="flex items-center gap-3">
                                                      <div className="w-8 h-8 bg-slate-100 text-slate-600 rounded-full flex items-center justify-center">
                                                        <CreditCard className="h-4 w-4" />
                                                      </div>
                                                      <span className="font-semibold text-slate-700">
                                                        {methodePaiementLabel(
                                                          trans
                                                        )}
                                                      </span>
                                                    </div>
                                                  </TableCell>
                                                  <TableCell>
                                                    <div className="flex items-center gap-3">
                                                      <div className="w-8 h-8 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center">
                                                        <Landmark className="h-4 w-4" />
                                                      </div>
                                                      <span className="text-gray-700 font-medium">
                                                        {trans.compte}
                                                      </span>
                                                    </div>
                                                  </TableCell>
                                                  <TableCell className="text-right">
                                                    <Button
                                                      variant="ghost"
                                                      size="sm"
                                                      className="h-8 w-8 p-0 rounded-full hover:bg-red-100 hover:text-red-600"
                                                      onClick={() => {
                                                        setDeleteTransDialog(
                                                          true
                                                        );
                                                        setDeletedTrans(trans);
                                                      }}
                                                    >
                                                      <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                  </TableCell>
                                                </TableRow>
                                              ))}
                                            </TableBody>
                                          </Table>
                                        </div>
                                      </div>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              )}
                            </Fragment>
                          </>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell
                            colSpan={
                              Object.values(visibleColumns).filter(Boolean)
                                .length + 1
                            }
                            align="center"
                          >
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
                              <p>Aucun devis trouvé</p>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>

                {devis.data?.length > 0 ? (
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
      <DeleteConfirmationDialog
        recordName={currentDevi?.numero}
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={() => {
          setDeleteDialogOpen(false);
          deleteDevi.mutate(currentDevi.id);
        }}
        itemType="devi"
      />
      <DeleteConfirmationDialog
        recordName={"le paiement"}
        isOpen={deleteTransDialog}
        onClose={() => {
          setDeleteTransDialog(false);
        }}
        onConfirm={() => {
          deleteTrans.mutate(deletedTrans.id);
          setDeleteTransDialog(false);
        }}
      />
      <Dialog open={statutChangeDialog} onOpenChange={setStatutChangeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer le changement de statut</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir changer le statut du devis{" "}
              <b>{pendingStatutChange?.numero?.toUpperCase()}</b> de{" "}
              <b>{pendingStatutChange?.currentStatut}</b> à{" "}
              <b>{pendingStatutChange?.statut}</b> ?
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
              onClick={() => {
                if (pendingStatutChange) {
                  updateStatut.mutate({
                    id: pendingStatutChange.id,
                    statut: pendingStatutChange.statut,
                  });
                  setStatutChangeDialog(false);
                  setPendingStatutChange(null);
                }
              }}
              disabled={updateStatut.isPending}
            >
              {updateStatut.isPending ? "Chargement..." : "Confirmer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
