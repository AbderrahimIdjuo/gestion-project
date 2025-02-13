"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import toast, { Toaster } from "react-hot-toast";
import CustomPagination from "@/components/customUi/customPagination";
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
  Plus,
  X,
  Pen,
  Trash2,
  ScrollTextIcon,
  FileChartLine,
  ChevronRight,
} from "lucide-react";
import { AddFactureForm } from "@/components/add-facture-form";
import { DeleteConfirmationDialog } from "@/components/delete-confirmation-dialog";
import { ClientInfoDialog } from "@/components/client-info";
import { UpdateFactureForm } from "@/components/update-facture-form";
import axios from "axios";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
type Facture = {
  date: Date;
  numero: string;
  id: string;
  lable: string;
  montant: number;
  type: string;
  payer: boolean;
  description: string;
};
function page() {
  const [searchQuery, setSearchQuery] = useState("");
  const [currfacture, setCurrFacture] = useState<Facture | undefined>();
  const [currentPage, setCurrentPage] = useState(1);
  const [type, setType] = useState<string>("récurrente");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAddingfacture, setIsAddingfacture] = useState(false);
  const [isUpdatingfacture, setIsUpdatingfacture] = useState(false);
  const itemsPerPage = 10;
  const getFactures = async () => {
    const response = await axios.get("/api/factures");
    const factures = response.data.factures;
    console.log("factures : ", factures);
    return factures;
  };
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ["factures"], queryFn: getFactures });

  const filteredFactures = query.data?.filter(
    (facture: Facture) =>
      (facture.lable.toLowerCase().includes(searchQuery.toLowerCase()) ||
        facture.description
          ?.toLowerCase()
          .includes(searchQuery.toLowerCase())) &&
      facture.type === type
  );

  const totalPages = Math.ceil(filteredFactures?.length / itemsPerPage);
  const currentFactures = filteredFactures?.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const deleteFacture = useMutation({
    mutationFn: async () => {
      const loadingToast = toast.loading("Suppression de la facture...");
      try {
        const response = await axios.delete(`/api/factures/${currfacture?.id}`);
        toast(
          <span>
            La facture <b>{currfacture?.lable.toUpperCase()}</b> a été supprimé
            avec succès!
          </span>,
          {
            icon: "🗑️",
          }
        );
        return response.data;
      } catch (error) {
        toast.error("Échec de la suppression de la facture");
        throw error;
      } finally {
        toast.dismiss(loadingToast);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["factures"] });
    },
  });
  return (
    <>
      <Toaster position="top-center" />
      <div className="space-y-6">
        <div className="flex justify-start gap-2 items-center">
          <span className="text-3xl font-bold">Dépenses </span>
          <ChevronRight className="h-8 w-8" />
          <span className="text-3xl font-bold">
            {type === "récurrente"
              ? "Factures récurrentes "
              : "Factures variantes"}
          </span>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0 sm:space-x-4 mb-6 ">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Rechercher des factures..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-full rounded-full bg-gray-50 focus-visible:ring-purple-500 focus-visible:ring-offset-0"
              spellCheck={false}
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Button
              onClick={() => {
                setType("récurrente");
                console.log("type", type);
              }}
              variant="outline"
              className="border-purple-500 bg-purple-100 text-purple-700 hover:bg-purple-200 hover:text-purple-900 rounded-full"
            >
              <ScrollTextIcon className="mr-2 h-4 w-4" />
              Factures récurrentes
            </Button>
            <Button
              onClick={() => {
                setType("variante");
                console.log("type", type);
              }}
              variant="outline"
              className="border-purple-500 bg-purple-100 text-purple-700 hover:bg-purple-200 hover:text-purple-900 rounded-full"
            >
              <FileChartLine className="mr-2 h-4 w-4" />
              Factures variantes
            </Button>
            <Button
              onClick={() => {
                setIsAddingfacture(!isAddingfacture);
                if (isUpdatingfacture) {
                  setIsUpdatingfacture(false);
                  setIsAddingfacture(false);
                }
              }}
              className={`${
                isAddingfacture || isUpdatingfacture
                  ? "bg-red-500 hover:bg-red-600"
                  : "bg-gradient-to-r from-fuchsia-500 via-purple-500 to-violet-500 hover:bg-purple-600 "
              } text-white font-semibold transition-all duration-300 transform hover:scale-105 rounded-full`}
            >
              {isAddingfacture || isUpdatingfacture ? (
                <>
                  <X className="mr-2 h-4 w-4" />
                  Annuler
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Ajouter une facture
                </>
              )}
            </Button>
          </div>
        </div>

        <div
          className={`grid ${
            isAddingfacture || isUpdatingfacture
              ? "grid-cols-3 gap-6"
              : "grid-cols-1"
          }`}
        >
          <div className="col-span-2">
            <div
              className={`grid gap-3 border mb-3 rounded-lg ${
                isAddingfacture || isUpdatingfacture ? "hidden" : ""
              } `}
            >
              {/* the full table  */}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Numéro</TableHead>
                    <TableHead>Lable</TableHead>
                    <TableHead>Montant</TableHead>
                    <TableHead>Statut de Paiement</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {query.isLoading ? (
                    [...Array(10)].map((_, index) => (
                      <TableRow
                        className="h-[2rem] MuiTableRow-root"
                        role="checkbox"
                        tabIndex={-1}
                        key={index}
                      >
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
                          <Skeleton className="h-4 w-[150px]" />
                        </TableCell>
                        <TableCell className="!py-2" align="left">
                          <Skeleton className="h-4 w-[150px]" />
                        </TableCell>
                        <TableCell className="!py-2">
                          <div className="flex gap-2 justify-end">
                            <Skeleton className="h-7 w-7 rounded-full" />
                            <Skeleton className="h-7 w-7 rounded-full" />
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : currentFactures?.length > 0 ? (
                    currentFactures?.map((facture: Facture) => (
                      <TableRow key={facture.id}>
                        <TableCell className="text-md">
                          {facture.numero}
                        </TableCell>
                        <TableCell className="text-md">
                          {facture.lable}
                        </TableCell>
                        <TableCell className="text-md">
                          {facture.montant} DH
                        </TableCell>
                        <TableCell className="text-md">
                          <span
                            className={`text-sm p-[1px] px-3 rounded-full  ${
                              facture.payer
                                ? "bg-green-100 text-green-600 font-semibold"
                                : "bg-red-100 text-red-600 font-semibold"
                            }`}
                          >
                            {facture.payer ? "Payé" : "Non payé"}
                          </span>
                        </TableCell>

                        <TableCell className="text-md">
                          {facture.description}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-full hover:bg-purple-100 hover:text-purple-600"
                              onClick={() => {
                                setCurrFacture(facture);
                                setIsUpdatingfacture(true);
                                setIsAddingfacture(false);
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
                                setCurrFacture(facture);
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
                      <TableCell colSpan={5} align="center">
                        Aucun facture trouvé
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {/* the half table with the name and Action columns */}
            <ScrollArea
              className={`h-[35rem] w-full  grid gap-3  border mb-3 rounded-lg ${
                !isAddingfacture && !isUpdatingfacture ? "hidden" : ""
              } `}
            >
              <div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Facture</TableHead>
                      <TableHead>Montant</TableHead>
                      <TableHead>Statut de paiement</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {query.isLoading ? (
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
                    ) : currentFactures?.length > 0 ? (
                      currentFactures?.map((facture: Facture) => (
                        <TableRow key={facture.id}>
                          <TableCell className="font-medium cursor-pointer hover:text-purple-600">
                            <div className="flex flex-row gap-2 justify-start items-center">
                              <div className="grid grid-rows-2">
                                <h1>{facture.lable.toUpperCase()}</h1>
                                <p className="text-sm text-muted-foreground">
                                  {facture.numero}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-md">
                            {facture.montant} DH
                          </TableCell>
                          <TableCell className="text-md">
                            <span
                              className={`text-sm  p-[1px] px-3 rounded-full  ${
                                facture.payer
                                  ? "bg-green-100 text-green-600 font-semibold"
                                  : "bg-red-100 text-red-600 font-semibold"
                              }`}
                            >
                              {facture.payer ? "Payé" : "Non payé"}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 rounded-full hover:bg-purple-100 hover:text-purple-600"
                                onClick={() => {
                                  setCurrFacture(facture);
                                  setIsUpdatingfacture(true);
                                  setIsAddingfacture(false);
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
                                  setCurrFacture(facture);
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
                          Aucun facture trouvé
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </ScrollArea>
            {filteredFactures?.length > 0 ? (
              <CustomPagination
                currentPage={currentPage}
                setCurrentPage={setCurrentPage}
                totalPages={totalPages}
              />
            ) : (
              ""
            )}
          </div>
          <div className={`${!isUpdatingfacture && "hidden"} `}>
            <ScrollArea className="w-full h-[75vh]">
              {isUpdatingfacture && (
                <UpdateFactureForm currFacture={currfacture} />
              )}
            </ScrollArea>
          </div>
          <div className={`${!isAddingfacture && "hidden"} `}>
            <ScrollArea className="w-full h-[75vh]">
              {isAddingfacture && <AddFactureForm />}
            </ScrollArea>
          </div>
        </div>
      </div>
      <DeleteConfirmationDialog
        recordName={currfacture?.lable}
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onConfirm={() => {
          deleteFacture.mutate();

          setIsDialogOpen(false);
        }}
      ></DeleteConfirmationDialog>
    </>
  );
}

export default page;
