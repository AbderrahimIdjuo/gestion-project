"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import toast, { Toaster } from "react-hot-toast";
import CustomPagination from "@/components/customUi/customPagination";
import { Label } from "@/components/ui/label";
import { LoadingDots } from "@/components/loading-dots";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, Pen, Trash2, Filter, Printer } from "lucide-react";
import { UpdateAchatCommandeForm } from "@/components/update-achat-commande-form";
import { DeleteConfirmationDialog } from "@/components/delete-confirmation-dialog";
import { AchatCommandesForm } from "@/components/achat-many-commande-form";
import axios from "axios";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PriceRangeSlider } from "@/components/customUi/customSlider";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import AddCommandeFournisseur from "@/components/add-commande-fournisseur";
import PreviewCommandeFournitureDialog from "@/components/preview-commandeFourniture";
import PrintCommandeFournitureDialog from "@/components/print-commandeFourniture";
import CustomTooltip from "@/components/customUi/customTooltip";
import UpdateCommandeFournisseur from "@/components/update-commande-fournisseur";
function formatDate(dateString) {
  return dateString?.split("T")[0].split("-").reverse().join("-");
}
export default function CommandesAchats() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false); // Delete dialog
  const [currCommande, setCurrCommande] = useState("");
  const [lastCommande, setLastCommande] = useState();
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
    setFilters({
      ...filters,
      montant: [0, maxMontant],
    });
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

  const categories = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const response = await axios.get("/api/categoriesProduits");
      return response.data.categories;
    },
  });

  const commandes = useQuery({
    queryKey: [
      "commandeFournisseur",
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
      const response = await axios.get("/api/achats-commandes", {
        params: {
          query: debouncedQuery,
          page,
          statut: filters.statut,
          from: startDate,
          to: endDate,
          minTotal: filters.montant[0],
          maxTotal: filters.montant[1],
          categorie: encodeURIComponent(filters.categorie),
          statutPaiement: filters.statutPaiement,
        },
      });
      console.log("commandesFourniture", response.data.commandes);
      setLastCommande(response.data.lastCommande);
      setTotalPages(response.data.totalPages);
      return response.data.commandes;
    },
    keepPreviousData: true, // Keeps old data visible while fetching new page
    refetchOnWindowFocus: false,
  });

  const deleteCommande = useMutation({
    mutationFn: async () => {
      const loadingToast = toast.loading("Suppression...");
      try {
        await axios.delete(`/api/achats-commandes/${currCommande.id}`);
        toast(
          <span>
            La commande numéro : <b>{currCommande?.numero.toUpperCase()}</b> a
            été supprimé avec succès!
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
      queryClient.invalidateQueries(["commandeFournisseur"]);
    },
  });

  const getStatusColor = (status) => {
    switch (status) {
      case "Livrée":
        return "bg-emerald-500";
      case "Annulé":
        return "bg-red-500";
      case "En cours":
        return "bg-amber-500";
      case "Expédier":
        return "bg-blue-500";
      default:
        return "bg-gray-500";
    }
  };
  const getStatusPaiemenetColor = (status) => {
    if (status) {
      return "bg-emerald-100 text-green-600 font-semibold";
    } else return "bg-red-100 text-red-600 font-semibold";
  };
  const status = [
    { value: "all", lable: "Tous les statut", color: "" },
    { value: "En cours", lable: "En cours", color: "amber-500" },
    { value: "Expédier", lable: "Expédier", color: "blue-500" },
    { value: "Livrée", lable: "Livrée", color: "emerald-500" },
    { value: "Annulé", lable: "Annulé", color: "red-500" },
  ];
  const statusPaiement = [
    { value: "all", lable: "Tous les statut" },
    { value: true, lable: "Payé" },
    { value: false, lable: "Impayé" },
  ];

  return (
    <>
      <Toaster position="top-center" />
      <div className="space-y-6 caret-transparent">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Commandes Fournitures</h1>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0 sm:space-x-4 mb-6 ">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Rechercher des commandes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-full rounded-full bg-gray-50 focus-visible:ring-purple-500 focus-visible:ring-offset-0"
              spellCheck={false}
            />
            <div className="absolute right-6 top-1/3 h-4 w-4 -translate-y-1/2 text-muted-foreground">
              {commandes.isFetching && !commandes.isLoading && <LoadingDots />}
            </div>
          </div>
          <div className="flex space-x-2">
            {/* <Sheet>
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
                    commandes.
                  </SheetDescription>
                </SheetHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label
                      htmlFor="categorie"
                      className="text-right text-black"
                    >
                      Catégorie
                    </Label>
                    <Select
                      value={filters.categorie}
                      onValueChange={(value) =>
                        setFilters({ ...filters, categorie: value })
                      }
                    >
                      <SelectTrigger className="col-span-3  bg-white focus:ring-purple-500">
                        <SelectValue placeholder="Toutes les catégories" />
                      </SelectTrigger>
                      <SelectContent className="bg-white">
                        <SelectItem key="all" value="all">
                          Toutes les catégories
                        </SelectItem>
                        {categories.data?.map((element) => (
                          <SelectItem
                            key={element.id}
                            value={element.categorie}
                          >
                            {element.categorie}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4 my-2">
                    <Label htmlFor="statut" className="text-right text-black">
                      Statut de paiement
                    </Label>
                    <Select
                      value={filters.statutPaiement}
                      name="statut"
                      onValueChange={(value) =>
                        setFilters({ ...filters, statutPaiement: value })
                      }
                    >
                      <SelectTrigger className="col-span-3 bg-white focus:ring-purple-500">
                        <SelectValue placeholder="Séléctionner un statut" />
                      </SelectTrigger>
                      <SelectContent>
                        {statusPaiement.map((statut, index) => (
                          <SelectItem key={index} value={statut.value}>
                            {statut.lable}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4 my-2">
                    <Label htmlFor="statut" className="text-right text-black">
                      Statut de livraison
                    </Label>
                    <Select
                      value={filters.statut}
                      name="statut"
                      onValueChange={(value) =>
                        setFilters({ ...filters, statut: value })
                      }
                    >
                      <SelectTrigger className="col-span-3 bg-white focus:ring-purple-500">
                        <SelectValue placeholder="Séléctionner un statut" />
                      </SelectTrigger>
                      <SelectContent>
                        {status.map((statut, index) => (
                          <SelectItem key={index} value={statut.value}>
                            <div className="flex items-center gap-2">
                              <span
                                className={`h-2 w-2 rounded-full bg-${statut.color}`}
                              />
                              {statut.lable}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4 my-2">
                    <Label htmlFor="montant" className="text-right text-black">
                      Montant
                    </Label>
                    <div className="col-span-3">
                      <PriceRangeSlider
                        min={0}
                        max={maxMontant}
                        step={100}
                        value={filters.montant}
                        onValueChange={(value) =>
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
            </Sheet> */}
            <AddCommandeFournisseur lastCommande={lastCommande} />
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
                  <TableHead>Fournisseur</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {commandes?.isLoading ? (
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
                      <TableCell className="!py-2">
                        <div className="flex gap-2 justify-end">
                          <Skeleton className="h-7 w-7 rounded-full" />
                          <Skeleton className="h-7 w-7 rounded-full" />
                          <Skeleton className="h-7 w-7 rounded-full" />
                          <Skeleton className="h-7 w-7 rounded-full" />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : commandes.data?.length > 0 ? (
                  commandes.data?.map((commande) => (
                    <TableRow key={commande.id}>
                      <TableCell className="text-md !py-2">
                        {formatDate(commande.date) ||
                          formatDate(commande.createdAt)}
                      </TableCell>
                      <TableCell className="text-md !py-2">
                        {commande.numero}
                      </TableCell>
                      <TableCell className="text-md font-medium !py-2">
                        {commande.fournisseur.nom}
                      </TableCell>
                      <TableCell className="text-right !py-2">
                        <div className="flex justify-end gap-2">
                          <CustomTooltip message="Modifier">
                            <UpdateCommandeFournisseur commande={commande} />
                          </CustomTooltip>
                          <CustomTooltip message="Visualiser">
                            <PreviewCommandeFournitureDialog
                              commande={commande}
                            />
                          </CustomTooltip>
                          <CustomTooltip message="Imprimer">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-full hover:bg-emerald-100 hover:text-emerald-600"
                              onClick={() => {
                                window.open(
                                  `/achats/commandes/${commande.id}/commandeFourniseur`,
                                  "_blank"
                                );
                                localStorage.setItem(
                                  "commandeFournitures",
                                  JSON.stringify(commande)
                                );
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
                                setCurrCommande(commande);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">Supprimer</span>
                            </Button>
                          </CustomTooltip>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={10} align="center">
                      Aucune commande trouvé
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          {commandes.data?.length > 0 ? (
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
      <DeleteConfirmationDialog
        recordName={currCommande?.numero}
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onConfirm={() => {
          deleteCommande.mutate();
          setIsDialogOpen(false);
        }}
        itemType="commandeFourniture"
      ></DeleteConfirmationDialog>
    </>
  );
}
