"use client";

import CustomDateRangePicker from "@/components/customUi/customDateRangePicker";
import CustomPagination from "@/components/customUi/customPagination";
import { PriceRangeSlider } from "@/components/customUi/customSlider";
import { AddButton } from "@/components/customUi/styledButton";
import { DeleteConfirmationDialog } from "@/components/delete-confirmation-dialog";
import { DevisActions } from "@/components/devis-actions";
import { LoadingDots } from "@/components/loading-dots";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { formatCurrency, methodePaiementLabel } from "@/lib/functions";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import {
  CalendarDays,
  CircleDollarSign,
  CreditCard,
  Filter,
  Landmark,
  Printer,
  Search,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { Fragment, useEffect, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
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
  const [transactions, setTransactions] = useState();
  const [BlGroups, setBlGroups] = useState();
  const [lastDevi, setLastDevi] = useState();
  const [expandedDevis, setExpandedDevis] = useState(null);
  const [info, setInfo] = useState(false);
  const [deleteTransDialog, setDeleteTransDialog] = useState(false);
  const [deletedTrans, setDeletedTrans] = useState();
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
    statut: "all",
    statutPaiement: "all",
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
  const devis = useQuery({
    queryKey: [
      "devis",
      filters.statut,
      debouncedQuery,
      page,
      startDate,
      endDate,
      filters.montant,
      filters.statutPaiement,
    ],
    queryFn: async () => {
      const response = await axios.get("/api/devis", {
        params: {
          query: debouncedQuery,
          page,
          statut: filters.statut,
          from: startDate,
          to: endDate,
          minTotal: filters.montant[0],
          maxTotal: filters.montant[1],
          statutPaiement: filters.statutPaiement,
        },
      });
      console.log("last Devis :", response.data.lastDevi);

      setLastDevi(response.data.lastDevi);
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

  const getStatusColor = status => {
    switch (status) {
      case "En attente":
        return "bg-amber-500";
      case "Accepté":
        return "bg-emerald-500";
      case "Annulé":
        return "bg-red-500";
      case "Expiré":
        return "bg-gray-500";
      default:
        return "bg-gray-500";
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

  const status = [
    { value: "all", lable: "Tous les statut", color: "" },
    { value: "En attente", lable: "En attente", color: "amber-500" },
    { value: "Accepté", lable: "Accepté", color: "green-500" },
    { value: "Annulé", lable: "Annulé", color: "red-500" },
    { value: "Expiré", lable: "Expiré", color: "gray-500" },
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

  const statutPaiement = (devisTotalPaye, devisTotal) => {
    if (
      devisTotal > 0 &&
      (devisTotalPaye === devisTotal || devisTotalPaye > devisTotal)
    ) {
      return { lable: "Payé", color: "bg-green-100 text-green-600" };
    } else if (devisTotalPaye > 0 && devisTotalPaye < devisTotal) {
      return { lable: "En partie", color: "bg-orange-100 text-orange-500" };
    } else if (devisTotalPaye === 0) {
      return { lable: "Impayé", color: "bg-slate-100 text-slate-600" };
    }
  };
  const statutPaiements = [
    { lable: "Tous", value: "all", color: "" },
    { lable: "Payé", value: "paye", color: "green" },
    { lable: "Impayé", value: "impaye", color: "gray" },
    { lable: "En partie", value: "enPartie", color: "amber" },
  ];

  return (
    <>
      <Toaster position="top-center"></Toaster>
      <div className="space-y-6 mb-[5rem]">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Devis</h1>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0 sm:space-x-4 mb-6">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Rechercher des devis..."
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
                  <SheetTitle className="text-black">Filtres</SheetTitle>
                  <SheetDescription className="text-gray-600">
                    Ajustez les filtres pour affiner votre recherche de devis.
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
                      onValueChange={value =>
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
                    <Label htmlFor="statut" className="text-left text-black">
                      Statut de Paiement :
                    </Label>
                    <Select
                      value={filters.statutPaiement}
                      name="statutPaiement"
                      onValueChange={value =>
                        setFilters({ ...filters, statutPaiement: value })
                      }
                    >
                      <SelectTrigger className="col-span-3 bg-white focus:ring-purple-500">
                        <SelectValue placeholder="Sélectionner un statut" />
                      </SelectTrigger>
                      <SelectContent>
                        {statutPaiements.map((statut, index) => (
                          <SelectItem key={index} value={statut.value}>
                            <div className={`flex items-center gap-2`}>
                              <div
                                className={`w-2 h-2 rounded-full bg-${statut.color}-500`}
                              ></div>
                              {statut.lable}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4 my-2">
                    <Label
                      htmlFor="statut"
                      className="col-span-1 text-left text-black"
                    >
                      Date :
                    </Label>
                    <div className="col-span-3">
                      <CustomDateRangePicker
                        startDate={startDate}
                        setStartDate={setStartDate}
                        endDate={endDate}
                        setEndDate={setEndDate}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-4 items-start gap-4 my-4">
                    <Label htmlFor="montant" className="text-left text-black">
                      Montant total :
                    </Label>
                    <div className="col-span-3">
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
            <Link href="/ventes/devis/nouveau">
              <AddButton
                onClick={() => {
                  localStorage.setItem(
                    "lastDeviNumber",
                    JSON.stringify(lastDevi.numero)
                  );
                }}
                title="Nouveau devis"
              />
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
                <TableHead className="text-right">Montant total</TableHead>
                <TableHead className="text-right">Fournitures</TableHead>
                <TableHead className="text-right">Marge</TableHead>
                <TableHead className="text-right">Payé</TableHead>
                <TableHead className="text-right">Reste</TableHead>
                <TableHead>Statut</TableHead>
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
                    {[...Array(9)].map((_, cellIndex) => (
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
                        <TableCell className="!py-2">
                          {formatDate(devis.date)}
                        </TableCell>
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
                          <div>
                            <span className="mr-2">{devis.numero}</span>
                            <span
                              className={`ml-2 px-2 py-1 rounded-full text-xs font-semibold uppercase ${
                                statutPaiement(devis.totalPaye, devis.total)
                                  ?.color
                              }`}
                            >
                              {
                                statutPaiement(devis.totalPaye, devis.total)
                                  ?.lable
                              }
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="!py-2">
                          {devis.client.nom.toUpperCase()}
                        </TableCell>
                        <TableCell className="!py-2  text-right">
                          {formatCurrency(devis.total)}
                        </TableCell>
                        <TableCell className="!py-2 text-right">
                          {formatCurrency(
                            totalFourniture(filteredOrders(devis.numero))
                          )}
                        </TableCell>
                        <TableCell className="!py-2 text-right">
                          {formatCurrency(
                            devis.total -
                              totalFourniture(filteredOrders(devis.numero))
                          )}
                        </TableCell>
                        <TableCell className="!py-2 text-right">
                          {formatCurrency(devis.totalPaye)}
                        </TableCell>

                        <TableCell className="!py-2 text-right">
                          {formatCurrency(devis.total - devis.totalPaye)}
                        </TableCell>
                        <TableCell className="!py-2">
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
                          <TableCell colSpan={10} className="p-0">
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
                                          transactionsDevis(devis.numero)
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
                                      {transactionsDevis(devis.numero)?.map(
                                        trans => (
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
                                                  {formatDate(trans.date) ||
                                                    formatDate(trans.createdAt)}
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
                                                  {methodePaiementLabel(trans)}
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
                                                  setDeleteTransDialog(true);
                                                  setDeletedTrans(trans);
                                                }}
                                              >
                                                <Trash2 className="h-4 w-4" />
                                              </Button>
                                            </TableCell>
                                          </TableRow>
                                        )
                                      )}
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
                  <TableCell colSpan={10} align="center">
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
    </>
  );
}
