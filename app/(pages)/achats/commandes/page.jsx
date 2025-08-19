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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import CustomDateRangePicker from "@/components/customUi/customDateRangePicker";
import { Search, Trash2, Filter, Printer } from "lucide-react";
import { DeleteConfirmationDialog } from "@/components/delete-confirmation-dialog";
import axios from "axios";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import AddCommandeFournisseur from "@/components/add-commande-fournisseur";
import PreviewCommandeFournitureDialog from "@/components/preview-commandeFourniture";
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
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [startDate, setStartDate] = useState();
  const [endDate, setEndDate] = useState();
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState();
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

  const commandes = useQuery({
    queryKey: ["commandeFournisseur", debouncedQuery, page, startDate, endDate],
    queryFn: async () => {
      const response = await axios.get("/api/achats-commandes", {
        params: {
          query: debouncedQuery,
          page,
          from: startDate,
          to: endDate,
        },
      });

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

  return (
    <>
      <Toaster position="top-center" />
      <div className="space-y-6 p-6">
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
                </div>
              </SheetContent>
            </Sheet>
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
                          <CustomTooltip message="Aperçu">
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
                                  `/achats/commandes/imprimer`,
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
                        <p>Aucune commande trouvé</p>
                      </div>
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
