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
import { Search, Plus, X, Pen, Trash2, Filter } from "lucide-react";
import { UpdateAchatCommandeForm } from "@/components/update-achat-commande-form";
import { DeleteConfirmationDialog } from "@/components/delete-confirmation-dialog";
import { ModifyClientDialog } from "@/components/modify-client-dialog";
import axios from "axios";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PriceRangeSlider } from "@/components/customUi/customSlider";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";

export default function CommandesAchats() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false); // Delete dialog
  const [currCommande, setCurrCommande] = useState("");
  const [isAddingCommande, setIsAddingCommande] = useState(false);
  const [isUpdatingCommande, setIsUpdatingCommande] = useState(false);
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
      "commandesAchats",
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

      console.log("commandes", response.data.commandes);
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
        await axios.delete(`/api/commandes/$${currCommande.id}`);
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
      queryClient.invalidateQueries(["commandesAchats"]);
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
          <h1 className="text-3xl font-bold">Commandes</h1>
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
            </Sheet>
            <Button
              onClick={() => {
                setIsAddingCommande(!isAddingCommande);
                if (isUpdatingCommande) {
                  setIsUpdatingCommande(false);
                  setIsAddingCommande(false);
                }
              }}
              className={`${
                isAddingCommande || isUpdatingCommande
                  ? "bg-red-500 hover:bg-red-600"
                  : "bg-gradient-to-r from-fuchsia-500 via-purple-500 to-violet-500 hover:bg-purple-600 "
              } text-white font-semibold transition-all duration-300 transform hover:scale-105 rounded-full`}
            >
              {isAddingCommande || isUpdatingCommande ? (
                <>
                  <X className="mr-2 h-4 w-4" />
                  Annuler
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Commander des produits
                </>
              )}
            </Button>
          </div>
        </div>

        <div
          className={`grid ${
            isAddingCommande || isUpdatingCommande
              ? "grid-cols-2 gap-6"
              : "grid-cols-1"
          }`}
        >
          <div>
            <div
              className={`grid gap-3 border mb-3 rounded-lg ${
                isAddingCommande || isUpdatingCommande ? "hidden" : ""
              } `}
            >
              {/* the full table  */}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Produit</TableHead>
                    <TableHead>Catégorie</TableHead>
                    <TableHead>Bon de commande </TableHead>
                    <TableHead>Fournisseur</TableHead>
                    <TableHead>Quantité</TableHead>
                    <TableHead>Montant</TableHead>
                    <TableHead>Statut de livraison </TableHead>
                    <TableHead>Statut de paiement</TableHead>
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
                        <TableCell className="!py-2" align="left">
                          <Skeleton className="h-4 w-full" />
                        </TableCell>
                        <TableCell className="!py-2" align="left">
                          <Skeleton className="h-4 w-full" />
                        </TableCell>
                        <TableCell className="!py-2" align="left">
                          <Skeleton className="h-4 w-full" />
                        </TableCell>
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
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : commandes.data?.length > 0 ? (
                    commandes.data?.map((commande) => (
                      <TableRow key={commande.id}>
                        <TableCell className="text-md">
                          {commande.createdAt.split("T")[0]}
                        </TableCell>
                        <TableCell className="text-md">
                          {commande.produit.designation}
                        </TableCell>
                        <TableCell className="text-md">
                          {commande.produit.categorie}
                        </TableCell>
                        <TableCell className="text-md">
                          {commande.commandeClient
                            ? commande.commandeClient.numero
                            : ""}
                        </TableCell>
                        <TableCell className="text-md">
                          {commande.produit.fournisseur?.nom.toUpperCase() ||
                            "Inconnu"}
                        </TableCell>
                        <TableCell className="text-md">
                          {commande.quantite}
                        </TableCell>
                        <TableCell className="text-md">
                          {(commande.prixUnite * commande.quantite).toFixed(2)}{" "}
                          DH
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span
                              className={`h-2 w-2 rounded-full ${getStatusColor(
                                commande.statut
                              )}`}
                            />
                            <span className="text-sm text-muted-foreground">
                              {commande.statut}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-md">
                          <span
                            className={`text-sm p-[1px] px-3 rounded-full  ${getStatusPaiemenetColor(
                              commande.payer
                            )}`}
                          >
                            {commande.payer ? "Payé" : "Impayé"}
                          </span>
                        </TableCell>

                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-full hover:bg-purple-100 hover:text-purple-600"
                              onClick={() => {
                                setCurrCommande(commande);
                                setIsUpdatingCommande(true);
                                setIsAddingCommande(false);
                              }}
                            >
                              <Pen className="h-4 w-4" />
                              <span className="sr-only">Modifier</span>
                            </Button>
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

            {/* the half table with the name and Action columns */}
            <ScrollArea
              className={`h-[35rem] w-full gap-3 col-span-2  border mb-3 rounded-lg ${
                !isAddingCommande && !isUpdatingCommande ? "hidden" : ""
              } `}
            >
              <div className="col-span-2">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Commande</TableHead>
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
                          <TableCell
                            className="!py-2 text-sm md:text-base"
                            align="left"
                          >
                            <div className="flex gap-2 items-center">
                              <Skeleton className="h-12 w-12 rounded-full" />
                              <Skeleton className="h-4 w-[150px]" />
                            </div>
                          </TableCell>
                          <TableCell className="!py-2" align="right">
                            <Skeleton className="h-4 w-[100px]" />
                          </TableCell>
                        </TableRow>
                      ))
                    ) : commandes.data?.length > 0 ? (
                      commandes.data?.map((commande) => (
                        <TableRow key={commande.id}>
                          <TableCell>
                            <div className="grid grid-cols-2 grid-rows-2 items-center gap-2">
                              <span className="text-md font-medium text-gray-900 col-span-2">
                                {commande.produit.designation}
                              </span>
                              <div className="flex items-center gap-1">
                                <span className="text-xs text-gray-500">
                                  Quantité:
                                </span>
                                <span className="text-sm font-medium text-gray-700">
                                  {commande.quantite}
                                </span>
                              </div>
                              <div className="flex items-center gap-1 justify-end">
                                <span className="text-xs text-gray-500">
                                  Montant:
                                </span>
                                <span className="text-sm font-medium text-gray-700">
                                  {commande.prixUnite * commande.quantite} DH
                                </span>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 rounded-full hover:bg-purple-100 hover:text-purple-600"
                                onClick={() => {
                                  setCurrCommande(commande);
                                  setIsUpdatingCommande(true);
                                  setIsAddingCommande(false);
                                }}
                              >
                                <Pen className="h-4 w-4" />
                                <span className="sr-only">Modifier</span>
                              </Button>
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
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={2} align="center">
                          Aucune commande trouvé
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </ScrollArea>
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
          {/* {isUpdatingCommande && (
            <ModifyClientDialog
              currCommande={currCommande}
              getCommandes={getCommandes}
            />
          )} */}
          {/* {isUpdatingCommande && (
            <div className="col-span-1">
              <UpdateAchatCommandeForm currCommande={currCommande} />
            </div>
          )} */}
          <div
            className={`${
              !isUpdatingCommande && "hidden"
            } col-span-1 mb-[5rem]`}
          >
            <ScrollArea className="w-full h-[85vh]">
              {isUpdatingCommande && (
                <UpdateAchatCommandeForm currCommande={currCommande} />
              )}
            </ScrollArea>
          </div>
        </div>
      </div>
      <DeleteConfirmationDialog
        recordName={currCommande?.id}
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onConfirm={() => {
          deleteCommande.mutate();
          setIsDialogOpen(false);
        }}
        itemType="client"
      ></DeleteConfirmationDialog>
    </>
  );
}
