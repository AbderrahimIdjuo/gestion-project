"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { DeleteConfirmationDialog } from "@/components/delete-confirmation-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AddButton } from "@/components/customUi/styledButton";
import CustomPagination from "@/components/customUi/customPagination";
import { Search, Pen, Trash2, Printer, Filter } from "lucide-react";
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
import { Label } from "@/components/ui/label";
import axios from "axios";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { fr } from "date-fns/locale";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { PriceRangeSlider } from "@/components/customUi/customSlider";

export default function CommandesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [commandesList, setCommandesList] = useState();
  const [isLoading, setIsLoading] = useState(true);
  const [maxMontant, setMaxMontant] = useState();
  const [date, setDate] = useState();
  const [currentCommande, setCurrentCommande] = useState();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const [filters, setFilters] = useState({
    client: "all",
    dateStart: "",
    dateEnd: "",
    montant: [0, maxMontant],
    statut: "all",
  });

  const itemsPerPage = 10;
  const totalList = commandesList?.map((product) => product.total);

  const filteredCommandes = commandesList?.filter(
    (commande) =>
      (searchQuery === "" ||
        commande.numero.toLowerCase().includes(searchQuery.toLowerCase()) ||
        commande.client.nom
          .toLowerCase()
          .includes(searchQuery.toLowerCase())) &&
      (filters.statut === "all" || commande.statut === filters.statut) &&
      commande.total >= filters.montant[0] &&
      commande.total <= filters.montant[1] &&
      (!date || new Date(commande.createdAt) >= new Date(date))
  );

  const totalPages = Math.ceil(filteredCommandes?.length / itemsPerPage);
  const currentCommandes = filteredCommandes?.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  const router = useRouter();
  const getCommandes = async () => {
    const result = await axios.get("/api/commandes");
    const { commandes } = result.data;
    setCommandesList(commandes);
    console.log(commandes);

    setIsLoading(false);
  };

  useEffect(() => {
    getCommandes();
  }, []);
  useEffect(() => {
    setFilters({ ...filters, montant: [0, maxMontant] });
  }, [maxMontant]);
  useEffect(() => {
    if (totalList?.length > 0) {
      const maxPrice = Math.max(...totalList);
      setMaxMontant(maxPrice);
    }
  }, [totalList]);
  useEffect(() => {
    setCurrentPage(1);
  }, [filters, searchQuery]);

  const getStatusColor = (status) => {
    switch (status) {
      case "En cours":
        return "bg-amber-500";
      case "Expédiée":
        return "bg-blue-500";
      case "Livrée":
        return "bg-emerald-500";
      case "Annulée":
        return "bg-red-500";
      default:
        return "bg-red-500";
    }
  };

  const handleEdit = (id) => {
    console.log("Edit commande:", id);
  };

  const handleInfo = (id) => {
    console.log("View info for commande:", id);
  };

  const deleteCommande = async (id, numero) => {
    try {
      await axios.delete(`/api/commandes/${id}`);
      toast(
        <span>
          Le devi numéro : <b>{numero.toUpperCase()}</b> a été supprimé avec
          succès!
        </span>,
        {
          icon: "🗑️",
        }
      );
      getCommandes();
    } catch (e) {
      console.log(e);
    }
  };

  const status = [
    { value: "all", lable: "All", color: "" },
    { value: "En cours", lable: "En cours", color: "amber-500" },
    { value: "Expédiée", lable: "Expédiée", color: "blue-500" },
    { value: "Livrée", lable: "Livrée", color: "green-500" },
    { value: "Annulé", lable: "Annulé", color: "red-500" },
  ];

  return (
    <>
      <Toaster position="top-center" />
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Commandes</h1>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0 sm:space-x-4 mb-6">
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
                  <div className="grid grid-cols-4 items-center gap-4 my-2">
                    <Label htmlFor="statut" className="text-right text-black">
                      Statut
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
                    <Label htmlFor="client" className="text-right text-black">
                      Date :
                    </Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "col-span-3 w-full justify-start text-left font-normal hover:text-purple-600 hover:bg-white hover:border-2 hover:border-purple-500",
                            !date && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon />
                          {date ? (
                            format(date, "PPP", { locale: fr })
                          ) : (
                            <span>Choisis une date</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={date}
                          onSelect={setDate}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
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
                        value={filters.montant} // Ensure montant is an array, e.g., [min, max]
                        onValueChange={
                          (value) => setFilters({ ...filters, montant: value }) // value will be [min, max]
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
            <AddButton
              onClick={() => router.push("/ventes/commandes/nouveau")}
              title="Nouvelle Commande"
            />
          </div>
        </div>

        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Numéro</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Montant</TableHead>
                <TableHead>Avance</TableHead>
                <TableHead>Reste a payer</TableHead>
                <TableHead>Statut</TableHead>
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
                      <Skeleton className="h-4 w-[150px]" />
                    </TableCell>
                    <TableCell className="!py-2" align="left">
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
                    <TableCell className="!py-2">
                      <div className="flex gap-2 justify-end">
                        <Skeleton className="h-7 w-7 rounded-full" />
                        <Skeleton className="h-7 w-7 rounded-full" />
                        <Skeleton className="h-7 w-7 rounded-full" />
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : currentCommandes?.length > 0 ? (
                currentCommandes?.map((commande) => (
                  <TableRow key={commande.id}>
                    <TableCell className="font-medium">
                      {commande.numero}
                    </TableCell>
                    <TableCell>{commande.createdAt.split("T")[0]}</TableCell>
                    <TableCell>{commande.client.nom.toUpperCase()}</TableCell>
                    <TableCell>{commande.total} DH</TableCell>
                    <TableCell>{commande.avance} DH</TableCell>
                    <TableCell>
                      {(commande.total - commande.avance).toFixed(2)} DH
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
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-full hover:bg-purple-100 hover:text-purple-600"
                          onClick={() =>
                            router.push(`/ventes/commandes/${commande.id}/update`)
                          }
                        >
                          <Pen className="h-4 w-4" />
                          <span className="sr-only">Modifier</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-full hover:bg-red-100 hover:text-red-600"
                          onClick={() => {
                            setDeleteDialogOpen(true);
                            setCurrentCommande(commande);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Supprimer</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-full hover:bg-green-100 hover:text-green-600"
                          onClick={() => window.open(`/ventes/commandes/${commande.id}/pdf`, "_blank")}
                        >
                          <Printer className="h-4 w-4" />
                          <span className="sr-only">Imprimer</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    Aucune commande trouvé
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {currentCommandes?.length > 0 ? (
          <CustomPagination
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            totalPages={totalPages}
          />
        ) : (
          ""
        )}
      </div>
      <DeleteConfirmationDialog
        recordName={currentCommande?.numero}
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={() => {
          setDeleteDialogOpen(false);
          deleteCommande(currentCommande.id, currentCommande.numero)
        }}
        itemType="produit"
      />
    </>
  );
}
