"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import toast, { Toaster } from "react-hot-toast";
import CustomPagination from "@/components/customUi/customPagination";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
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
import { AchatCommandeForm } from "@/components/achat-commande-form";
import { DeleteConfirmationDialog } from "@/components/delete-confirmation-dialog";
import { ClientInfoDialog } from "@/components/client-info";
import { ModifyClientDialog } from "@/components/modify-client-dialog";
import axios from "axios";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PriceRangeSlider } from "@/components/customUi/customSlider";

export default function ClientsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isDialogOpen, setIsDialogOpen] = useState(false); // Delete dialog
  const [isLoading, setIsLoading] = useState(false); // Fetch the list of commandes
  const [currCommande, setCurrCommande] = useState("");
  //const [commandeList, setCommandeList] = useState([]);
  const [isAddingCommande, setIsAddingCommande] = useState(false);
  const [isUpdatingCommande, setIsUpdatingCommande] = useState(false);
  const [filters, setFilters] = useState({
    categorie: "all",
    status: "all",
    statusPaiement: "all",
    montant: [0, 10000],
  });
  const itemsPerPage = 10;
  const commandeList = [
    {
      id: 1,
      numero: "A-CMD201547852",
      fournisseur: "Oujdi Abderrahim",
      statutLivraison: "En cours",
      statutPaiement: "Impayé",
      createdAt: "2025-01-20",
      montant: 2500,
      categorie: "Électronique",
    },
    {
      id: 2,
      numero: "A-CMD201547852",
      fournisseur: "Oujdi Arwa",
      statutLivraison: "Livrée",
      statutPaiement: "Impayé",
      createdAt: "2025-01-20",
      montant: 8200,
      categorie: "Vêtements",
    },
    {
      id: 3,
      numero: "A-CMD201547852",
      fournisseur: "Oujdi Fayza",
      statutLivraison: "En cours",
      statutPaiement: "Impayé",
      createdAt: "2025-01-20",
      montant: 6300,
      categorie: "Vêtements",
    },
    {
      id: 4,
      numero: "A-CMD201547852",
      fournisseur: "Oujdi Mohamed",
      statutLivraison: "Expédier",
      statutPaiement: "Payer",
      createdAt: "2025-01-20",
      montant: 7400,
      categorie: "Bureautique",
    },
    {
      id: 5,
      numero: "A-CMD201547852",
      fournisseur: "Boudrqa Abdellah",
      statutLivraison: "Annulé",
      statutPaiement: "Payer",
      createdAt: "2025-01-20",
      montant: 5000,
      categorie: "Bureautique",
    },
  ];

  const filteredCommandes = commandeList.filter(
    (commande) =>
      (commande.numero.toLowerCase().includes(searchQuery.toLowerCase()) ||
        commande.fournisseur
          ?.toLowerCase()
          .includes(searchQuery.toLowerCase())) &&
      (filters.categorie === "all" ||
        commande.categorie === filters.categorie) &&
      (filters.status === "all" ||
        commande.statutLivraison === filters.status) &&
      (filters.statusPaiement === "all" ||
        commande.statutPaiement === filters.statusPaiement) &&
      commande.montant >= filters.montant[0] &&
      commande.montant <= filters.montant[1]
  );

  const totalPages = Math.ceil(filteredCommandes.length / itemsPerPage);
  const currentCommandes = filteredCommandes.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // const getCommandes = async () => {
  //   const result = await axios.get("/api/achats-commandes");
  //   const { Commandes } = result.data;
  //   setCommandeList(Commandes);
  //   setIsLoading(false);
  // };

  const deleteClient = async () => {
    try {
      await axios.delete(`/api/achats-commandes/${currCommande.id}`);
      toast(
        <span>
          La commande <b>{currCommande?.numero}</b> a été supprimé avec succès!
        </span>,
        {
          icon: "🗑️",
        }
      );
      //   getCommandes();
    } catch (e) {
      console.log(e);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  // useEffect(() => {
  //   getCommandes();
  // }, []);
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
    switch (status) {
      case "Payer":
        return "bg-emerald-100 text-emerald-600";
      case "Impayé":
        return "bg-red-100 text-red-600";
      default:
        return "bg-gray-500";
    }
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
    { value: "Payer", lable: "Payer" },
    { value: "Impayé", lable: "Impayé" },
  ];
  const categories = [
    { value: "all", lable: "Toutes les catégories" },
    { value: "Électronique", lable: "Électronique" },
    { value: "Vêtements", lable: "Vêtements" },
    { value: "Alimentation", lable: "Alimentation" },
    { value: "Bureautique", lable: "Bureautique" },
  ];

  return (
    <>
      <Toaster position="top-center" />
      <div className="space-y-6">
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
            />
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
                      <SelectTrigger className="col-span-3 border-purple-200 bg-white focus:ring-purple-500">
                        <SelectValue placeholder="Toutes les catégories" />
                      </SelectTrigger>
                      <SelectContent className="bg-white">
                        {categories.map((categorie) => (
                          <SelectItem
                            key={categorie.value}
                            value={categorie.value}
                          >
                            {categorie.lable}
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
                      value={filters.statusPaiement}
                      name="statut"
                      onValueChange={(value) =>
                        setFilters({ ...filters, statusPaiement: value })
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
                      value={filters.status}
                      name="statut"
                      onValueChange={(value) =>
                        setFilters({ ...filters, status: value })
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
                        max={10000}
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
              ? "grid-cols-3 gap-6"
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
                    <TableHead>Numéro</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Fournisseur</TableHead>
                    <TableHead>Montant</TableHead>
                    <TableHead>Catégorie</TableHead>
                    <TableHead>Statut de livraison </TableHead>
                    <TableHead>Statut de paiement</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    [...Array(10)].map((_, index) => (
                      <TableRow
                        className="h-[2rem] MuiTableRow-root"
                        role="checkbox"
                        tabIndex={-1}
                        key={index}
                      >
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
                          <Skeleton className="h-4 w-[100px]" />
                        </TableCell>
                        <TableCell className="!py-2" align="left">
                          <Skeleton className="h-4 w-[100px]" />
                        </TableCell>
                        <TableCell className="!py-2">
                          <div className="flex gap-2 justify-end">
                            <Skeleton className="h-7 w-7 rounded-full" />
                            <Skeleton className="h-7 w-7 rounded-full" />
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : currentCommandes.length > 0 ? (
                    currentCommandes?.map((commande) => (
                      <TableRow key={commande.id}>
                        <TableCell className="text-md">
                          {commande.numero}
                        </TableCell>
                        <TableCell className="text-md">
                          {commande.createdAt}
                        </TableCell>
                        <TableCell className="text-md">
                          {commande.fournisseur.toUpperCase()}
                        </TableCell>
                        <TableCell className="text-md">
                          {commande.montant}
                        </TableCell>
                        <TableCell className="text-md">
                          {commande.categorie}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span
                              className={`h-2 w-2 rounded-full ${getStatusColor(
                                commande.statutLivraison
                              )}`}
                            />
                            <span className="text-sm text-muted-foreground">
                              {commande.statutLivraison}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-md">
                          <span
                            className={`text-sm text-muted-foreground p-[1px] px-3 rounded-full  ${getStatusPaiemenetColor(
                              commande.statutPaiement
                            )}`}
                          >
                            {commande.statutPaiement}
                          </span>
                          {/* <Badge
                            variant="outline"
                            className={`!text-white ${getStatusPaiemenetColor(
                              commande.statutPaiement
                            )}`}
                          >
                            {commande.statutPaiement}
                          </Badge> */}
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
                      <TableCell colSpan={8} align="center">
                        Aucune commande trouvé
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {/* the half table with the name and Action columns */}
            <ScrollArea
              className={`h-[35rem] w-full  grid gap-3  border mb-3 rounded-lg ${
                !isAddingCommande && !isUpdatingCommande ? "hidden" : ""
              } `}
            >
              <div className="col-span-1">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Commande</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
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
                    ) : currentCommandes.length > 0 ? (
                      currentCommandes?.map((commande) => (
                        <TableRow key={commande.id}>
                          <TableCell>{commande.numero}</TableCell>
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
                      <TableCell colSpan={2} align="center">
                        Aucune commande trouvé
                      </TableCell>
                    )}
                  </TableBody>
                </Table>
              </div>
            </ScrollArea>
            {filteredCommandes.length > 0 ? (
              <CustomPagination
                currentPage={currentPage}
                setCurrentPage={setCurrentPage}
                totalPages={totalPages}
              />
            ) : (
              ""
            )}
          </div>
          {isUpdatingCommande && (
            <ModifyClientDialog
              currCommande={currCommande}
              getCommandes={getCommandes}
            />
          )}
          {isAddingCommande && (
            <div className="col-span-2">
              <AchatCommandeForm />
            </div>
          )}
        </div>
      </div>
      <DeleteConfirmationDialog
        recordName={currCommande?.designation}
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onConfirm={() => {
          deleteClient();
          setIsDialogOpen(false);
          getCommandes();
        }}
        itemType="client"
      ></DeleteConfirmationDialog>
    </>
  );
}
