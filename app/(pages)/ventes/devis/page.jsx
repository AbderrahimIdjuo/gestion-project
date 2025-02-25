"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import CustomTooltip from "@/components/customUi/customTooltip";
import Link from "next/link";
import { AddButton } from "@/components/customUi/styledButton";
import { DeleteConfirmationDialog } from "@/components/delete-confirmation-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Search,
  Pen,
  Trash2,
  Filter,
  Printer,
  CalendarIcon,
} from "lucide-react";
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
import toast, { Toaster } from "react-hot-toast";
import CustomPagination from "@/components/customUi/customPagination";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { PriceRangeSlider } from "@/components/customUi/customSlider";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";

export default function DevisPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [currentDevi, setCurrentDevi] = useState();
  const [date, setDate] = useState();
  const [devisList, setDevisList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [maxMontant, setMaxMontant] = useState();
  const [filters, setFilters] = useState({
    client: "all",
    dateStart: "",
    dateEnd: "",
    montant: [0, maxMontant],
    statut: "all",
  });

  const itemsPerPage = 10;
  useEffect(() => {
    setFilters({ ...filters, montant: [0, maxMontant] });
  }, [maxMontant]);
  const totalList = devisList?.map((devi) => devi.total);
  useEffect(() => {
    if (totalList?.length > 0) {
      const maxPrice = Math.max(...totalList);
      setMaxMontant(maxPrice);
    }
  }, [totalList]);
  const filteredDevis = devisList?.filter(
    (devis) =>
      (searchQuery === "" ||
        devis.numero.toLowerCase().includes(searchQuery.toLowerCase()) ||
        devis.client.nom.toLowerCase().includes(searchQuery.toLowerCase())) &&
      (filters.client === "all" || devis.client === filters.client) &&
      (filters.statut === "all" || devis.statut === filters.statut) &&
      devis.total >= filters.montant[0] &&
      devis.total <= filters.montant[1] &&
      (!date || new Date(devis.createdAt) >= new Date(date))
  );

  const totalPages = Math.ceil(filteredDevis.length / itemsPerPage);
  const currentDevis = filteredDevis.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  const router = useRouter();

  const getDevis = async () => {
    const result = await axios.get("/api/devis");
    const { devis } = result.data;
    console.log("list devis: ", devis);

    setDevisList(devis);
    setIsLoading(false);
  };

  useEffect(() => {
    getDevis();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [filters, searchQuery]);

  const getStatusColor = (status) => {
    switch (status) {
      case "En attente":
        return "bg-amber-500";
      case "Accepté":
        return "bg-emerald-500";
      case "Refusé":
        return "bg-red-500";
      case "Expiré":
        return "bg-gray-500";
      default:
        return "bg-gray-500";
    }
  };
  function formatDate(dateString) {
    return dateString.split("T")[0].split("-").reverse().join("-");
  }

  const deleteDevi = async (id, numero) => {
    console.log("delete item");

    try {
      await axios.delete(`/api/devis/${id}`);
      toast(
        <span>
          Le devi numéro : <b>{numero.toUpperCase()}</b> a été supprimé avec
          succès!
        </span>,
        {
          icon: "🗑️",
        }
      );
      getDevis();
    } catch (e) {
      console.log(e);
    }
  };
  const status = [
    { value: "all", lable: "Tous les statut", color: "" },
    { value: "En attente", lable: "En attente", color: "amber-500" },
    { value: "Accepté", lable: "Accepté", color: "green-500" },
    { value: "Refusé", lable: "Refusé", color: "red-500" },
    { value: "Expiré", lable: "Expiré", color: "gray-500" },
  ];

  return (
    <>
      <Toaster position="top-center"></Toaster>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Devis</h1>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0 sm:space-x-4 mb-6">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Rechercher des devis..."
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
                    Ajustez les filtres pour affiner votre recherche de devis.
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
                      Montant total :
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
            <Link href="/ventes/devis/nouveau">
              <AddButton title="Nouveau devi" />
            </Link>
          </div>
        </div>

        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Numéro</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Montant total</TableHead>

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
                    <TableCell className="!py-2">
                      <div className="flex gap-2 justify-end">
                        <Skeleton className="h-7 w-7 rounded-full" />
                        <Skeleton className="h-7 w-7 rounded-full" />
                        <Skeleton className="h-7 w-7 rounded-full" />
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : currentDevis?.length > 0 ? (
                currentDevis?.map((devis) => (
                  <TableRow key={devis.id}>
                    <TableCell>{formatDate(devis.createdAt)}</TableCell>
                    <TableCell className="font-medium">
                      {devis.numero}
                    </TableCell>
                    <TableCell>{devis.client.nom.toUpperCase()}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span
                          className={`h-2 w-2 rounded-full ${getStatusColor(
                            devis.statut
                          )}`}
                        />
                        <span className="text-sm text-muted-foreground">
                          {devis.statut}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{devis.total} DH</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <CustomTooltip message="Modifier">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-full hover:bg-purple-100 hover:text-purple-600"
                            onClick={() =>
                              router.push(`/ventes/devis/${devis.id}/update`)
                            }
                          >
                            <Pen className="h-4 w-4" />
                            <span className="sr-only">Modifier</span>
                          </Button>
                        </CustomTooltip>
                        <CustomTooltip message="Supprimer">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-full hover:bg-red-100 hover:text-red-600"
                            onClick={() => {
                              setDeleteDialogOpen(true);
                              setCurrentDevi(devis);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Supprimer</span>
                          </Button>
                        </CustomTooltip>
                        <CustomTooltip message="Imprimer">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-full hover:bg-green-100 hover:text-green-600"
                            onClick={() => {
                              window.open(
                                `/ventes/devis/${devis.id}/pdf`,
                                "_blank"
                              );
                              localStorage.setItem(
                                "devi",
                                JSON.stringify(devis)
                              );
                            }}
                          >
                            <Printer className="h-4 w-4" />
                            <span className="sr-only">Imprimer</span>
                          </Button>
                        </CustomTooltip>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    Aucun devi trouvé
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {currentDevis?.length > 0 ? (
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
        recordName={currentDevi?.numero}
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={() => {
          setDeleteDialogOpen(false);
          deleteDevi(currentDevi.id, currentDevi.numero);
        }}
        itemType="devi"
      />
    </>
  );
}
