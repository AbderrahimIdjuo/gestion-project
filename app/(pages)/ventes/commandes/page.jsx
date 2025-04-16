"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DeleteConfirmationDialog } from "@/components/delete-confirmation-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Link from "next/link";
import { AddButton } from "@/components/customUi/styledButton";
import CustomPagination from "@/components/customUi/customPagination";
import { PaymentDialog } from "@/components/select-bank-account";
import {
  Search,
  Pen,
  Trash2,
  Printer,
  Filter,
  CircleDollarSign,
  CalendarDays,
  Landmark,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import CustomTooltip from "@/components/customUi/customTooltip";
import CustomDateRangePicker from "@/components/customUi/customDateRangePicker";
import { Card } from "@/components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { LoadingDots } from "@/components/loading-dots";
import { Label } from "@/components/ui/label";
import axios from "axios";
import { Skeleton } from "@/components/ui/skeleton";
import toast, { Toaster } from "react-hot-toast";
import { addtransaction } from "@/app/api/actions";
import { PriceRangeSlider } from "@/components/customUi/customSlider";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export default function CommandesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [maxMontant, setMaxMontant] = useState();
  const [currentCommande, setCurrentCommande] = useState();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [compte, setCompte] = useState("");
  const [montant, setMontant] = useState(""); // montant de paiement
  const [isBankDialogOpen, setIsBankDialogOpen] = useState(false);
  const [info, setInfo] = useState(false);
  const [transactions, setTransactions] = useState();
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState();
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [startDate, setStartDate] = useState();
  const [endDate, setEndDate] = useState();
  const [expandedCommande, setExpandedCommande] = useState(null);
  const [filters, setFilters] = useState({
    client: "all",
    dateStart: "",
    dateEnd: "",
    montant: [0, maxMontant],
    statut: "all",
    etat: "all",
  });

  const queryClient = useQueryClient();
  const toggleExpand = (commandeId) => {
    setExpandedCommande(expandedCommande === commandeId ? null : commandeId);
  };
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery);
      setPage(1);
    }, 500); // Adjust delay as needed

    return () => {
      clearTimeout(handler);
    };
  }, [searchQuery]);

  const commandes = useQuery({
    queryKey: [
      "commandes",
      filters.statut,
      debouncedQuery,
      page,
      startDate,
      endDate,
      filters.montant,
      filters.etat,
    ],
    queryFn: async () => {
      const response = await axios.get("/api/commandes", {
        params: {
          query: debouncedQuery,
          page,
          statut: filters.statut,
          from: startDate,
          to: endDate,
          minTotal: filters.montant[0],
          maxTotal: filters.montant[1],
          etat: filters.etat,
        },
      });
      setMaxMontant(response.data.maxMontant);
      setTransactions(response.data.transactionsList);
      setTotalPages(response.data.totalPages);
      console.log("trasactionsList ##", response.data.transactionsList);
      console.log("commandes ##", response.data.commandes);

      return response.data.commandes;
    },
    keepPreviousData: true, // Keeps old data visible while fetching new page
    refetchOnWindowFocus: false,
  });

  const transactionPerCommande = (numero) => {
    const trans = transactions?.filter((c) => c.reference === numero);
    console.log("trans", trans);

    return trans;
  };

  const etatPaiement = (commande) => {
    if (
      commande.totalPaye === commande.totalDevi ||
      commande.totalPaye > commande.totalDevi
    ) {
      return (
        <span className="text-sm p-[1px] px-3 rounded-full  bg-green-100 text-green-600 font-medium">
          Payé
        </span>
      );
    } else if (commande.totalPaye === 0) {
      return (
        <span className="text-sm p-[1px] px-3 rounded-full  bg-red-100 text-red-600 font-medium">
          Impayé
        </span>
      );
    } else
      return (
        <span className="text-sm p-[1px] px-3 rounded-full  bg-orange-100 text-orange-600 font-medium">
          En partie
        </span>
      );
  };

  // intialiser les valeure du monatant total handler
  useEffect(() => {
    setFilters({ ...filters, montant: [0, maxMontant] });
  }, [maxMontant]);

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
  function formatDate(dateString) {
    return dateString.split("T")[0].split("-").reverse().join("-");
  }

  const deleteCommande = useMutation({
    mutationFn: async (id) => {
      const loadingToast = toast.loading("Suppression...");
      try {
        await axios.delete(`/api/commandes/${id}`);
        toast(
          <span>
            La commande numéro : <b>{currentCommande?.numero?.toUpperCase()}</b>{" "}
            a été supprimé avec succès!
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
      queryClient.invalidateQueries(["commandes"]);
      queryClient.invalidateQueries(["devis"]);
    },
  });
  const data = {
    ...currentCommande,
    compte,
    montant: Number(montant),
    type: "recette",
  };
  const createTransaction = useMutation({
    mutationFn: async (data) => {
      const loadingToast = toast.loading("Paiement en cours...");
      try {
        await addtransaction(data);
        toast.success("Paiement éffectué avec succès");
      } catch (error) {
        toast.error("Échec de l'opération!");
        throw error;
      } finally {
        toast.dismiss(loadingToast);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["transactions"]);
      queryClient.invalidateQueries(["commandes"]);
    },
  });
  const status = [
    { value: "all", lable: "Tous les statuts", color: "" },
    { value: "En cours", lable: "En cours", color: "amber-500" },
    { value: "Expédiée", lable: "Expédiée", color: "blue-500" },
    { value: "Livrée", lable: "Livrée", color: "green-500" },
    { value: "Annulé", lable: "Annulé", color: "red-500" },
  ];

  return (
    <>
      <Toaster position="top-center" />
      <div className="space-y-6 mb-[5rem]">
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
                  <div className="grid grid-cols-4 items-center gap-4 my-2">
                    <Label htmlFor="statut" className="text-left text-black">
                      Statut :
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
                    <Label htmlFor="etat" className="text-left text-black">
                      État :
                    </Label>
                    <Select
                      value={filters.etat}
                      name="etat"
                      onValueChange={(value) =>
                        setFilters({ ...filters, etat: value })
                      }
                    >
                      <SelectTrigger className="col-span-3 bg-white focus:ring-purple-500">
                        <SelectValue placeholder="Séléctionner un statut" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">
                          <div className="flex items-center gap-2">
                            Tous les états
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
                        <SelectItem value="impaye">
                          <div className="flex items-center gap-2">
                            <span
                              className={`h-2 w-2 rounded-full bg-red-500`}
                            />
                            Impayé
                          </div>
                        </SelectItem>
                        <SelectItem value="enPartie">
                          <div className="flex items-center gap-2">
                            <span
                              className={`h-2 w-2 rounded-full bg-orange-500`}
                            />
                            En partie
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="date" className="text-left text-black">
                      Date :
                    </Label>
                    <CustomDateRangePicker
                      startDate={startDate}
                      setStartDate={setStartDate}
                      endDate={endDate}
                      setEndDate={setEndDate}
                    />
                  </div>
                  <div className="grid grid-cols-4 items-start gap-4 my-4">
                    <Label htmlFor="montant" className="text-left text-black">
                      cout de production:
                    </Label>
                    <div className="col-span-3">
                      <PriceRangeSlider
                        min={0}
                        max={maxMontant}
                        step={100}
                        value={filters.montant} // Ensure montant is an array, e.g., [min, max]
                        onValueChange={(value) => {
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
            <Link href="/ventes/commandes/nouvelleCommande">
              <AddButton title="Nouvelle Commande" />
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
                <TableHead>Coût</TableHead>
                <TableHead>Montant</TableHead>
                <TableHead>Marge</TableHead>
                <TableHead>Reste</TableHead>
                <TableHead>État</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {commandes?.isLoading ? (
                [...Array(10)].map((_, index) => (
                  <TableRow
                    className="h-[2rem] MuiTableRow-root !py-2"
                    role="checkbox"
                    key={index}
                  >
                    <TableCell
                      className="!py-2 text-sm md:text-base  "
                      align="left"
                    >
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                    <TableCell className="!py-2 " align="left">
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                    <TableCell className="!py-2 " align="left">
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
                        <Skeleton className="h-7 w-7 rounded-full" />
                        <Skeleton className="h-7 w-7 rounded-full" />
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : commandes?.data?.length > 0 ? (
                commandes?.data?.map((commande) => (
                  <>
                    <TableRow key={commande.id}>
                      <TableCell className="!py-2">
                        {formatDate(commande.createdAt)}
                      </TableCell>
                      <TableCell
                        onClick={() => {
                          toggleExpand(commande.id);
                          if (commande.totalPaye !== 0) {
                            if (currentCommande?.id === commande.id) {
                              setInfo(!info);
                            } else setInfo(true);
                            setCurrentCommande(commande);
                            console.log(
                              "trasactionsList #####",
                              transactionPerCommande(commande.numero)
                            );
                          }
                        }}
                        className={`font-medium !py-2  ${
                          (commande.totalPaye === commande.totalDevi ||
                            commande.totalPaye > commande.totalDevi) &&
                          "cursor-pointer hover:text-green-400"
                        } ${
                          commande.totalPaye !== 0 &&
                          commande.totalPaye < commande.totalDevi &&
                          "cursor-pointer hover:text-orange-400"
                        }`}
                      >
                        {commande.numero}
                      </TableCell>
                      <TableCell className="!py-2">
                        {commande.client.nom.toUpperCase()}
                      </TableCell>
                      <TableCell className="!py-2">
                        {commande.total} DH
                      </TableCell>
                      <TableCell className="!py-2">
                        {commande.totalDevi} DH
                      </TableCell>
                      <TableCell className="!py-2">
                        {commande.totalDevi - commande.total} DH
                      </TableCell>
                      <TableCell className="!py-2">
                        {commande.totalDevi - commande.totalPaye} DH
                      </TableCell>
                      <TableCell className="!py-2">
                        {etatPaiement(commande)}
                      </TableCell>
                      <TableCell className="!py-2">
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
                      <TableCell className="text-right !py-2">
                        <div className="flex justify-end gap-2">
                          <Link
                            href={`/ventes/commandes/${commande.id}/update`}
                          >
                            <CustomTooltip message="Modifier">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 rounded-full hover:bg-purple-100 hover:text-purple-600"
                              >
                                <Pen className="h-4 w-4" />
                              </Button>
                            </CustomTooltip>
                          </Link>
                          <CustomTooltip message="Supprimer">
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
                            </Button>
                          </CustomTooltip>
                          <CustomTooltip message="Payer">
                            <Button
                              onClick={() => {
                                setIsBankDialogOpen(true);
                                setCurrentCommande(commande);
                                console.log(
                                  "montant payer : ",
                                  commande.totalPaye
                                );
                                console.log(
                                  "total devi : ",
                                  commande.totalDevi
                                );
                              }}
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-full hover:bg-sky-100 hover:text-sky-600"
                              disabled={
                                commande.totalPaye === commande.totalDevi
                              }
                            >
                              <CircleDollarSign className="h-4 w-4" />
                            </Button>
                          </CustomTooltip>
                          <CustomTooltip message="Imprimer">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-full hover:bg-emerald-100 hover:text-emerald-600"
                              onClick={() => {
                                window.open(
                                  `/ventes/commandes/${commande.id}/pdf`,
                                  "_blank"
                                );
                                localStorage.setItem(
                                  "commande",
                                  JSON.stringify(commande)
                                );
                              }}
                            >
                              <Printer className="h-4 w-4" />
                            </Button>
                          </CustomTooltip>
                        </div>
                      </TableCell>
                    </TableRow>
                    {info && expandedCommande === commande.id && (
                      <TableRow className="">
                        <TableCell colSpan={10} className="p-0">
                          <div className="px-8 py-4 animate-in slide-in-from-top-2 duration-200">
                            <div className="">
                              <h4 className="text-sm font-semibold mb-3">
                                Historique des paiements
                              </h4>
                              <div className="space-y-2">
                                {transactionPerCommande(commande.numero)?.map(
                                  (trans) => (
                                    <div
                                      key={trans.id}
                                      className="flex flex-wrap md:flex-nowrap items-center gap-3 p-1 bg-slate-100 rounded-full border border-border/50 hover:bg-slate-100 transition-colors w-[50%]"
                                    >
                                      <div className="flex items-center gap-2 min-w-[180px]">
                                        <div className="bg-slate-700 text-white p-2 rounded-full">
                                          <CalendarDays className="h-4 w-4" />
                                        </div>
                                        <span className="text-sm text-slate-800 font-medium">
                                          {formatDate(trans.createdAt)}
                                        </span>
                                      </div>

                                      <div className="flex items-center gap-2 min-w-[150px]">
                                        <div className="bg-slate-700 text-white p-2 rounded-full">
                                          <CircleDollarSign className="h-4 w-4" />
                                        </div>
                                        <span className="text-sm text-slate-800 font-semibold">
                                          {trans.montant} DH
                                        </span>
                                      </div>

                                      <div className="flex items-center gap-2">
                                        <div className="bg-slate-700 text-white p-2 rounded-full">
                                          <Landmark className="h-4 w-4" />
                                        </div>
                                        <span className="text-sm text-slate-800 font-medium">
                                          {trans.compte}
                                        </span>
                                      </div>
                                    </div>
                                  )
                                )}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                    {/* {expandedCommande === commande.id && (
                      <TableRow>
                        <TableCell>Paiements </TableCell>
                      
                        
                        <TableCell colSpan={9} className="p-0">
                          <div className="px-8 py-4 animate-in slide-in-from-top-2 duration-200">
                            <ul>
                              {transactionPerCommande(commande.numero)?.map(
                                (trans) => (
                                  <li
                                    key={trans.id}
                                    className="flex justify-start w-[60%] bg-slate-200 text-sky-800 font-medium my-1 px-2 rounded-full"
                                  >
                                    <span className="flex gap-1 items-center">
                                      <CalendarDays className="h-4 w-4" />{" "}
                                      {formatDate(trans.createdAt)}
                                    </span>
                                    <span className="flex gap-1 items-center ml-6">
                                      <CircleDollarSign className="h-4 w-4" />{" "}
                                      {trans.montant} DH
                                    </span>
                                    <span className="flex gap-1 items-center ml-6">
                                      <Landmark className="h-4 w-4" />{" "}
                                      {trans.compte}
                                    </span>
                                  </li>
                                )
                              )}
                            </ul>
                          </div>
                        </TableCell>
                      </TableRow>
                    )} */}
                  </>
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

        {commandes?.data?.length > 0 ? (
          <CustomPagination
            currentPage={page}
            setCurrentPage={setPage}
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
          deleteCommande.mutate(currentCommande.id);
        }}
        itemType="produit"
      />
      <PaymentDialog
        setCompte={setCompte}
        compte={compte}
        setMontant={setMontant}
        isOpen={isBankDialogOpen}
        onClose={() => setIsBankDialogOpen(false)}
        onConfirm={() => {
          createTransaction.mutate(data);
        }}
      />
    </>
  );
}
