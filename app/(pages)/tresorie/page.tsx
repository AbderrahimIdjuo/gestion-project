"use client";
import * as React from "react";
import { useState, useEffect } from "react";
import toast, { Toaster } from "react-hot-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import CustomPagination from "@/components/customUi/customPagination";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, Filter, Search, ChevronRight } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { DeleteConfirmationDialog } from "@/components/delete-confirmation-dialog";
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
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
type Transaction = {
  id: string;
  createdAt: string;
  type: string;
  montant: number;
  compte: string;
  reference: string;
  lable: string;
};
type Compte = {
  compte: string;
};
export default function Banques() {
  const [searchQuery, setSearchQuery] = useState("");
  const [transaction, setTransaction] = useState<Transaction | undefined>();
  const [deleteDialog, setDeleteDialog] = useState<boolean>(false);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>();
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [filters, setFilters] = useState({
    compte: "all",
    type: "all",
  });
  const queryClient = useQueryClient();

  // Debounce input (waits 500ms after the last keystroke)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery);
      setPage(1);
    }, 500); // Adjust delay as needed

    return () => {
      clearTimeout(handler);
    };
  }, [searchQuery]);

  const transactions = useQuery({
    queryKey: [
      "transactions",
      debouncedQuery,
      page,
      filters.type,
      filters.compte,
      startDate,
      endDate,
    ], // Include filters & page
    queryFn: async () => {
      const response = await axios.get("/api/tresorie", {
        params: {
          page,
          query: debouncedQuery,
          type: filters.type,
          compte: filters.compte,
          from: startDate,
          to: endDate,
        },
      });
      setTotalPages(response.data.totalPages);
      return response.data.transactions;
    },
    keepPreviousData: true, // Keeps old data visible while fetching new page
  });
  const deleteTrans = useMutation({
    mutationFn: async () => {
      const loadingToast = toast.loading("Suppression...");
      try {
        await axios.delete("/api/tresorie", {
          params: {
            id: transaction?.id,
          },
        });
        toast(<span>Transaction supprimé avec succée!</span>, {
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
      queryClient.invalidateQueries({ queryKey: ["factures"] });
      queryClient.invalidateQueries({ queryKey: ["depensesVariantes"] });
      queryClient.invalidateQueries({ queryKey: ["commandes"] });
    },
  });

  const comptes = useQuery({
    queryKey: ["comptes"],
    queryFn: async () => {
      const response = await axios.get("/api/comptesBancaires");
      const comptes = response.data.comptes;
      console.log("comptes : ", comptes);
      return comptes;
    },
  });

  return (
    <>
      <Toaster position="top-center" />
      <div className="space-y-6 mb-[5rem]">
        <div className="flex justify-between items-center ">
          <h1 className="text-3xl font-bold">Transactions</h1>
        </div>
        <div className="flex justify-between space-x-2">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Recherche..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-full rounded-full bg-gray-50 focus-visible:ring-purple-500 focus-visible:ring-offset-0"
            />
          </div>
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
                  transactions.
                </SheetDescription>
              </SheetHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4 my-2">
                  <Label htmlFor="type" className="text-left text-black">
                    Type :
                  </Label>
                  <Select
                    value={filters.type}
                    name="type"
                    onValueChange={(value) =>
                      setFilters({ ...filters, type: value })
                    }
                  >
                    <SelectTrigger className="col-span-3 bg-white focus:ring-purple-500">
                      <SelectValue placeholder="Séléctionner un statut" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les types</SelectItem>
                      <SelectItem value="recette">
                        <div className="flex items-center gap-2">
                          <span
                            className={`h-2 w-2 shadow-md rounded-full bg-green-500`}
                          />
                          Recette
                        </div>
                      </SelectItem>
                      <SelectItem value="dépense">
                        <div className="flex items-center gap-2">
                          <span className={`h-2 w-2 rounded-full bg-red-500`} />
                          Dépense
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4 my-2">
                  <Label htmlFor="compte" className="text-left text-black">
                    Compte :
                  </Label>
                  <Select
                    value={filters.compte}
                    name="compte"
                    onValueChange={(value) =>
                      setFilters({ ...filters, compte: value })
                    }
                  >
                    <SelectTrigger className="col-span-3 bg-white focus:ring-purple-500">
                      <SelectValue placeholder="Séléctionner un statut" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les comptes</SelectItem>
                      {comptes.data?.map((element: Compte, index: number) => (
                        <SelectItem key={index} value={element.compte}>
                          {element.compte}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="date" className="text-left text-black">
                    Date :
                  </Label>
                  <div className="flex gap-2 justify-center items-center">
                    {/* date début */}
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "col-span-3 w-full justify-start text-left font-normal hover:text-purple-600 hover:bg-white hover:border-2 hover:border-purple-500",
                            !startDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon />
                          {startDate ? (
                            format(startDate, "dd-MM-yyyy")
                          ) : (
                            <span>début</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={startDate}
                          onSelect={setStartDate}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <ChevronRight className="h-10 w-10" />
                    {/* date fin */}
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "col-span-3 w-full justify-start text-left font-normal hover:text-purple-600 hover:bg-white hover:border-2 hover:border-purple-500",
                            !endDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon />
                          {endDate ? (
                            format(endDate, "dd-MM-yyyy")
                          ) : (
                            <span>fin</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={endDate}
                          onSelect={setEndDate}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
        <div className="flex justify between gap-6 items-start">
          <div className="w-full col-span-1 sm:col-span-2 md:col-span-3">
            {/* Table */}
            <div className="rounded-lg border overflow-x-auto mb-3">
              <Table className="w-full">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[150px]">Date</TableHead>
                    <TableHead className="w-[150px]">Time</TableHead>
                    <TableHead>Réference</TableHead>
                    <TableHead>Montant</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Compte</TableHead>

                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.isLoading ? (
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

                        <TableCell className="!py-2 " align="right">
                          <Skeleton className="h-7 w-7 rounded-full" />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : transactions.data?.length > 0 ? (
                    transactions.data?.map((transaction: Transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell className="font-medium">
                          {format(transaction.createdAt, "dd-MM-yyyy")}
                        </TableCell>
                        <TableCell className="font-medium">
                          {transaction.createdAt.split("T")[1].split(".")[0]}
                        </TableCell>
                        <TableCell className="font-medium">
                          {transaction.reference}
                        </TableCell>
                        <TableCell className="font-medium">
                          {transaction.montant} DH
                        </TableCell>
                        <TableCell className="font-medium">
                          <span
                            className={`text-sm p-[1px] px-3 rounded-full  ${
                              transaction.type === "recette"
                                ? "bg-green-100 text-green-600 font-medium"
                                : "bg-red-100 text-red-600 font-medium"
                            }`}
                          >
                            {transaction.type}
                          </span>
                        </TableCell>
                        <TableCell className="font-medium">
                          {transaction.compte}
                        </TableCell>

                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              onClick={() => {
                                setDeleteDialog(true);
                                setTransaction(transaction);
                              }}
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-full hover:bg-red-100 hover:text-red-600"
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
                      <TableCell colSpan={7} className="text-center">
                        Aucune transaction trouvée
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            {totalPages && totalPages > 1 ? (
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
      <DeleteConfirmationDialog
        recordName={"la transaction"}
        isOpen={deleteDialog}
        onClose={() => {
          setDeleteDialog(false);
        }}
        onConfirm={() => {
          deleteTrans.mutate();
          setDeleteDialog(false);
        }}
      />
    </>
  );
}
