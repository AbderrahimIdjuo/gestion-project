"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import CustomTooltip from "@/components/customUi/customTooltip";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Search, Pen, Trash2, Filter } from "lucide-react";
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
import { Slider } from "@/components/ui/slider";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
import CustomPagination from "@/components/customUi/customPagination";
import { Skeleton } from "@/components/ui/skeleton";

export default function DevisPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [devisList, setDevisList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({
    client: "all",
    dateStart: "",
    dateEnd: "",
    montant: [0, 100000],
    statut: "all",
  });
  const itemsPerPage = 10;

  const filteredDevis = devisList?.filter(
    (devis) =>
      (searchQuery === "" ||
        devis.numero.toLowerCase().includes(searchQuery.toLowerCase()) ||
        devis.client.nom.toLowerCase().includes(searchQuery.toLowerCase())) &&
      (filters.client === "all" || devis.client === filters.client) &&
      (filters.statut === "all" || devis.statut === filters.statut) &&
      devis.total >= filters.montant[0] &&
      devis.total <= filters.montant[1] &&
      (!filters.dateStart ||
        !filters.dateEnd ||
        (new Date(devis.date) >= new Date(filters.dateStart) &&
          new Date(devis.date) <= new Date(filters.dateEnd)))
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
                  className="border-purple-500 bg-purple-100 text-purple-700 hover:bg-purple-200 hover:text-purple-900"
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
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="statut" className="text-right text-black">
                      Statut
                    </Label>
                    <Select
                      value={filters.statut}
                      onValueChange={(value) =>
                        setFilters({ ...filters, statut: value })
                      }
                    >
                      <SelectTrigger className="col-span-3 border-purple-200 bg-white focus:ring-purple-500">
                        <SelectValue placeholder="Tous les statuts" />
                      </SelectTrigger>
                      <SelectContent className="bg-white">
                        <SelectItem value="all">Tous les statuts</SelectItem>
                        <SelectItem value="En attente">En attente</SelectItem>
                        <SelectItem value="Accepté">Accepté</SelectItem>
                        <SelectItem value="Refusé">Refusé</SelectItem>
                        <SelectItem value="Expiré">Expiré</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label
                      htmlFor="dateStart"
                      className="text-right text-black"
                    >
                      Date
                    </Label>
                    <Input
                      id="dateStart"
                      type="date"
                      value={filters.dateStart}
                      onChange={(e) =>
                        setFilters({ ...filters, dateStart: e.target.value })
                      }
                      className="col-span-3 !border-purple-200 bg-white focus:!ring-purple-500"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="montant" className="text-right text-black">
                      Montant total
                    </Label>
                    <div className="col-span-3">
                      <Slider
                        min={0}
                        max={10000}
                        step={100}
                        value={filters.montant}
                        onValueChange={(value) =>
                          setFilters({ ...filters, montant: value })
                        }
                        className="w-full [&_[role=slider]]:bg-purple-500 [&_[role=slider]]:border-purple-500 [&_[role=slider]]:focus:ring-purple-500 [&_[role=track]]:bg-purple-100 [&_[role=range]]:bg-purple-300"
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
              onClick={() => router.push("/ventes/devis/nouveau")}
              className="bg-gradient-to-r from-fuchsia-500 via-purple-500 to-violet-500 hover:bg-purple-600 hover:scale-105 text-white font-semibold transition-all duration-300 transform"
            >
              <Plus className="mr-2 h-4 w-4" />
              Nouveau Devis
            </Button>
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
                    hover
                    role="checkbox"
                    tabIndex={-1}
                    key={index}
                  >
                    <TableCell
                      className="!py-2 text-sm md:text-base"
                      key={index}
                      align="left"
                    >
                      <Skeleton className="h-4 w-[150px]" />
                    </TableCell>
                    <TableCell className="!py-2" key={index} align="left">
                      <Skeleton className="h-4 w-[150px]" />
                    </TableCell>
                    <TableCell className="!py-2" key={index} align="left">
                      <Skeleton className="h-4 w-[150px]" />
                    </TableCell>
                    <TableCell className="!py-2" key={index} align="left">
                      <Skeleton className="h-4 w-[150px]" />
                    </TableCell>
                    <TableCell className="!py-2" key={index} align="left">
                      <Skeleton className="h-4 w-[100px]" />
                    </TableCell>
                    <TableCell className="!py-2" key={index} align="right">
                      <Skeleton className="h-4 w-[100px]" />
                    </TableCell>
                  </TableRow>
                ))
              ) : currentDevis?.length > 0 ? (
                currentDevis?.map((devis) => (
                  <TableRow className="cursor-pointer hover:bg-zinc-100" key={devis.id}
                  onClick={()=>{
                    window.open(`/ventes/devis/${devis.id}/pdf`, "_blank");
                  }}
                  >
                    <TableCell>{devis.createdAt.split("T")[0]}</TableCell>
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
                              deleteDevi(devis.id, devis.numero);
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
                <TableCell colSpan={7} align="center">
                  Aucun devi trouvé
                </TableCell>
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
    </>
  );
}
